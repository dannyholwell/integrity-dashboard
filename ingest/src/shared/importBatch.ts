import { createHash } from 'node:crypto'
import { basename, resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import type { AppDatabase } from './db.js'

type StartImportBatchInput = {
  db: AppDatabase
  domain: string
  sourceName: string
  filePath: string
}

export const getFileHash = (filePath: string) =>
  createHash('sha256').update(readFileSync(filePath)).digest('hex')

export const startImportBatch = ({ db, domain, sourceName, filePath }: StartImportBatchInput) => {
  const absolutePath = resolve(filePath)
  const sourceFileHash = getFileHash(absolutePath)
  const result = db
    .prepare(`
      INSERT INTO import_batch (
        domain,
        source_name,
        source_file_name,
        source_file_hash,
        status
      ) VALUES (?, ?, ?, ?, 'running')
    `)
    .run(domain, sourceName, basename(absolutePath), sourceFileHash)

  return {
    batchId: Number(result.lastInsertRowid),
    sourceFileHash,
    absolutePath,
  }
}

type FinishImportBatchInput = {
  db: AppDatabase
  batchId: number
  status: 'completed' | 'completed_with_rejects' | 'failed'
  rowCount: number
  insertedCount: number
  rejectedCount: number
  notes?: string
}

export const finishImportBatch = ({
  db,
  batchId,
  status,
  rowCount,
  insertedCount,
  rejectedCount,
  notes,
}: FinishImportBatchInput) => {
  db.prepare(`
    UPDATE import_batch
    SET
      status = ?,
      row_count = ?,
      inserted_count = ?,
      rejected_count = ?,
      notes = ?
    WHERE id = ?
  `).run(status, rowCount, insertedCount, rejectedCount, notes ?? null, batchId)
}

type RecordRejectInput = {
  db: AppDatabase
  batchId: number
  domain: string
  rowNumber: number
  errorCode: string
  errorMessage: string
  rawPayload: unknown
}

export const recordReject = ({ db, batchId, domain, rowNumber, errorCode, errorMessage, rawPayload }: RecordRejectInput) => {
  db.prepare(`
    INSERT INTO import_reject (
      batch_id,
      domain,
      row_number,
      error_code,
      error_message,
      raw_payload_json
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(batchId, domain, rowNumber, errorCode, errorMessage, JSON.stringify(rawPayload))
}
