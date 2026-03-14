import type { CsvRecord } from '../shared/csv.js'
import { readCsvFile } from '../shared/csv.js'
import type { AppDatabase } from '../shared/db.js'
import { hashParts } from '../shared/hash.js'
import { finishImportBatch, recordReject, startImportBatch } from '../shared/importBatch.js'
import { runNormalization } from '../normalize/runNormalization.js'

const readField = (row: CsvRecord, keys: string[]) => {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== '') {
      return value
    }
  }

  return undefined
}

const buildFallbackTaskSourceRecordId = (title: string, category: string, sourcePath: string | null) => {
  if (sourcePath) {
    return `task-path-${hashParts([sourcePath]).slice(0, 16)}`
  }

  return `task-title-${hashParts([title, category]).slice(0, 16)}`
}

const normalizeTask = (row: CsvRecord, sourceName: string) => {
  const title = readField(row, ['title', 'name'])
  if (!title) {
    throw new Error('Missing title')
  }

  const category = readField(row, ['category']) ?? 'General'
  const sourcePath = readField(row, ['source_path', 'path']) ?? null
  const sourceRecordId = readField(row, ['source_record_id', 'source_id', 'id']) ?? buildFallbackTaskSourceRecordId(title, category, sourcePath)
  const effort = (readField(row, ['effort']) ?? 'medium').toLowerCase()
  const status = (readField(row, ['status']) ?? 'ready').toLowerCase()

  if (!['low', 'medium', 'high'].includes(effort)) {
    throw new Error(`Invalid effort "${effort}"`)
  }

  if (!['ready', 'active', 'waiting'].includes(status)) {
    throw new Error(`Invalid status "${status}"`)
  }

  return {
    id: hashParts([sourceName, sourceRecordId]).slice(0, 24),
    sourceRecordId,
    title,
    summary: readField(row, ['summary', 'notes']) ?? '',
    category,
    effort,
    status,
    dueDate: readField(row, ['due_date', 'due']),
    sourcePath,
  }
}

export const importTasksCsv = (db: AppDatabase, filePath: string, sourceName: string) => {
  const { batchId, absolutePath } = startImportBatch({
    db,
    domain: 'tasks',
    sourceName,
    filePath,
  })

  const rows = readCsvFile(absolutePath)
  let insertedCount = 0
  let skippedCount = 0
  let rejectedCount = 0

  const insertRaw = db.prepare(`
    INSERT INTO raw_task_import (
      batch_id,
      row_number,
      source_record_id,
      title_raw,
      category_raw,
      effort_raw,
      status_raw,
      due_raw,
      source_path_raw,
      raw_payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const upsertCore = db.prepare(`
    INSERT INTO core_task (
      id,
      source_system,
      source_record_id,
      title,
      summary,
      category,
      effort,
      status,
      due_date,
      source_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_system, source_record_id) DO UPDATE SET
      title = excluded.title,
      summary = excluded.summary,
      category = excluded.category,
      effort = excluded.effort,
      status = excluded.status,
      due_date = excluded.due_date,
      source_path = excluded.source_path,
      updated_at = CURRENT_TIMESTAMP
    WHERE
      core_task.title IS NOT excluded.title
      OR core_task.summary IS NOT excluded.summary
      OR core_task.category IS NOT excluded.category
      OR core_task.effort IS NOT excluded.effort
      OR core_task.status IS NOT excluded.status
      OR core_task.due_date IS NOT excluded.due_date
      OR core_task.source_path IS NOT excluded.source_path
  `)

  const transaction = db.transaction(() => {
    rows.forEach((row, index) => {
      insertRaw.run(
        batchId,
        index + 1,
        readField(row, ['source_record_id', 'source_id', 'id']) ?? null,
        readField(row, ['title', 'name']) ?? null,
        readField(row, ['category']) ?? null,
        readField(row, ['effort']) ?? null,
        readField(row, ['status']) ?? null,
        readField(row, ['due_date', 'due']) ?? null,
        readField(row, ['source_path', 'path']) ?? null,
        JSON.stringify(row)
      )

      try {
        const task = normalizeTask(row, sourceName)
        const result = upsertCore.run(
          task.id,
          sourceName,
          task.sourceRecordId,
          task.title,
          task.summary,
          task.category,
          task.effort,
          task.status,
          task.dueDate ?? null,
          task.sourcePath
        )
        if (result.changes > 0) {
          insertedCount += 1
        } else {
          skippedCount += 1
        }
      } catch (error) {
        rejectedCount += 1
        recordReject({
          db,
          batchId,
          domain: 'tasks',
          rowNumber: index + 1,
          errorCode: 'TASK_NORMALIZATION_ERROR',
          errorMessage: error instanceof Error ? error.message : 'Unknown task normalization error',
          rawPayload: row,
        })
      }
    })
  })

  try {
    transaction()
    runNormalization(db)
    finishImportBatch({
      db,
      batchId,
      status: rejectedCount > 0 ? 'completed_with_rejects' : 'completed',
      rowCount: rows.length,
      insertedCount,
      skippedCount,
      rejectedCount,
    })
  } catch (error) {
    finishImportBatch({
      db,
      batchId,
      status: 'failed',
      rowCount: rows.length,
      insertedCount,
      skippedCount,
      rejectedCount,
      notes: error instanceof Error ? error.message : 'Unknown import failure',
    })
    throw error
  }

  return { rowCount: rows.length, insertedCount, skippedCount, rejectedCount }
}
