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

const toNumberOrNull = (value: string | undefined) => (value === undefined ? null : Number(value))

export const importMoodCsv = (db: AppDatabase, filePath: string, sourceName: string) => {
  const { batchId, absolutePath } = startImportBatch({
    db,
    domain: 'mood',
    sourceName,
    filePath,
  })

  const rows = readCsvFile(absolutePath)
  let insertedCount = 0
  let rejectedCount = 0

  const insertRaw = db.prepare(`
    INSERT INTO raw_mood_import (
      batch_id,
      row_number,
      source_record_id,
      entry_at_raw,
      mood_raw,
      energy_raw,
      stress_raw,
      tags_raw,
      note_raw,
      raw_payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const upsertCore = db.prepare(`
    INSERT INTO core_mood_entry (
      id,
      source_system,
      source_record_id,
      entry_at,
      day,
      mood_score,
      energy_score,
      stress_score,
      tags_json,
      note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_system, source_record_id) DO UPDATE SET
      entry_at = excluded.entry_at,
      day = excluded.day,
      mood_score = excluded.mood_score,
      energy_score = excluded.energy_score,
      stress_score = excluded.stress_score,
      tags_json = excluded.tags_json,
      note = excluded.note,
      updated_at = CURRENT_TIMESTAMP
  `)

  const transaction = db.transaction(() => {
    rows.forEach((row, index) => {
      insertRaw.run(
        batchId,
        index + 1,
        readField(row, ['source_record_id', 'id']) ?? null,
        readField(row, ['entry_at', 'timestamp']) ?? null,
        readField(row, ['mood_score', 'mood']) ?? null,
        readField(row, ['energy_score', 'energy']) ?? null,
        readField(row, ['stress_score', 'stress']) ?? null,
        readField(row, ['tags']) ?? null,
        readField(row, ['note', 'notes']) ?? null,
        JSON.stringify(row)
      )

      try {
        const entryAt = readField(row, ['entry_at', 'timestamp'])
        const moodScore = readField(row, ['mood_score', 'mood'])
        if (!entryAt || !moodScore) {
          throw new Error('Missing mood entry timestamp or score')
        }

        const sourceRecordId = readField(row, ['source_record_id', 'id']) ?? `mood-${index + 1}`
        const entryDate = entryAt.slice(0, 10)
        const stableId = createHash('sha1').update(`${sourceName}:${sourceRecordId}`).digest('hex').slice(0, 24)

        upsertCore.run(
          stableId,
          sourceName,
          sourceRecordId,
          entryAt,
          entryDate,
          Number(moodScore),
          toNumberOrNull(readField(row, ['energy_score', 'energy'])),
          toNumberOrNull(readField(row, ['stress_score', 'stress'])),
          JSON.stringify(
            (readField(row, ['tags']) ?? '')
              .split('|')
              .map((tag) => tag.trim())
              .filter(Boolean)
          ),
          readField(row, ['note', 'notes']) ?? null
        )
        insertedCount += 1
      } catch (error) {
        rejectedCount += 1
        recordReject({
          db,
          batchId,
          domain: 'mood',
          rowNumber: index + 1,
          errorCode: 'MOOD_NORMALIZATION_ERROR',
          errorMessage: error instanceof Error ? error.message : 'Unknown mood normalization error',
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
