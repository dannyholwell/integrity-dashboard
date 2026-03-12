import { createHash } from 'node:crypto'
import type { CsvRecord } from '../shared/csv.js'
import { readCsvFile } from '../shared/csv.js'
import type { AppDatabase } from '../shared/db.js'
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

const normalizeTask = (row: CsvRecord, index: number, sourceName: string) => {
  const title = readField(row, ['title', 'name'])
  if (!title) {
    throw new Error('Missing title')
  }

  const sourceRecordId = readField(row, ['source_record_id', 'source_id', 'id']) ?? `task-${index + 1}`
  const effort = (readField(row, ['effort']) ?? 'medium').toLowerCase()
  const status = (readField(row, ['status']) ?? 'ready').toLowerCase()

  if (!['low', 'medium', 'high'].includes(effort)) {
    throw new Error(`Invalid effort "${effort}"`)
  }

  if (!['ready', 'active', 'waiting'].includes(status)) {
    throw new Error(`Invalid status "${status}"`)
  }

  return {
    id: createHash('sha1').update(`${sourceName}:${sourceRecordId}`).digest('hex').slice(0, 24),
    sourceRecordId,
    title,
    summary: readField(row, ['summary', 'notes']) ?? '',
    category: readField(row, ['category']) ?? 'General',
    effort,
    status,
    dueDate: readField(row, ['due_date', 'due']),
    sourcePath: readField(row, ['source_path', 'path']) ?? null,
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
        const task = normalizeTask(row, index, sourceName)
        upsertCore.run(
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
        insertedCount += 1
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
      rejectedCount,
    })
  } catch (error) {
    finishImportBatch({
      db,
      batchId,
      status: 'failed',
      rowCount: rows.length,
      insertedCount,
      rejectedCount,
      notes: error instanceof Error ? error.message : 'Unknown import failure',
    })
    throw error
  }

  return { rowCount: rows.length, insertedCount, rejectedCount }
}
