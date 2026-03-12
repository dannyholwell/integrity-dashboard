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

const parseAmountMinor = (value: string) => Math.round(Number(value.replace(/[^0-9.-]/g, '')) * 100)

const ensureAccount = (db: AppDatabase, sourceName: string, sourceAccountId: string, accountName: string) => {
  const accountId = createHash('sha1').update(`${sourceName}:${sourceAccountId}`).digest('hex').slice(0, 24)

  db.prepare(`
    INSERT INTO core_account (
      id,
      source_system,
      source_account_id,
      name,
      institution,
      account_type
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_system, source_account_id) DO UPDATE SET
      name = excluded.name,
      updated_at = CURRENT_TIMESTAMP
  `).run(accountId, sourceName, sourceAccountId, accountName, sourceName, 'transaction')

  return accountId
}

export const importTransactionsCsv = (db: AppDatabase, filePath: string, sourceName: string) => {
  const { batchId, absolutePath } = startImportBatch({
    db,
    domain: 'finance',
    sourceName,
    filePath,
  })

  const rows = readCsvFile(absolutePath)
  let insertedCount = 0
  let rejectedCount = 0

  const insertRaw = db.prepare(`
    INSERT INTO raw_transaction_import (
      batch_id,
      row_number,
      source_record_id,
      account_ref_raw,
      posted_at_raw,
      description_raw,
      amount_raw,
      balance_raw,
      category_raw,
      raw_payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const upsertCore = db.prepare(`
    INSERT INTO core_transaction (
      id,
      account_id,
      source_system,
      source_record_id,
      posted_at,
      settled_at,
      description,
      merchant,
      category,
      subcategory,
      amount_minor,
      currency,
      direction,
      balance_minor,
      note,
      dedupe_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_system, source_record_id) DO UPDATE SET
      posted_at = excluded.posted_at,
      settled_at = excluded.settled_at,
      description = excluded.description,
      merchant = excluded.merchant,
      category = excluded.category,
      subcategory = excluded.subcategory,
      amount_minor = excluded.amount_minor,
      currency = excluded.currency,
      direction = excluded.direction,
      balance_minor = excluded.balance_minor,
      note = excluded.note,
      updated_at = CURRENT_TIMESTAMP
  `)

  const transaction = db.transaction(() => {
    rows.forEach((row, index) => {
      insertRaw.run(
        batchId,
        index + 1,
        readField(row, ['source_record_id', 'id']) ?? null,
        readField(row, ['account_id', 'account']) ?? null,
        readField(row, ['posted_at', 'date']) ?? null,
        readField(row, ['description']) ?? null,
        readField(row, ['amount']) ?? null,
        readField(row, ['balance']) ?? null,
        readField(row, ['category']) ?? null,
        JSON.stringify(row)
      )

      try {
        const postedAt = readField(row, ['posted_at', 'date'])
        const description = readField(row, ['description'])
        const amountValue = readField(row, ['amount'])
        if (!postedAt || !description || !amountValue) {
          throw new Error('Missing required finance fields')
        }

        const sourceRecordId = readField(row, ['source_record_id', 'id']) ?? `finance-${index + 1}`
        const sourceAccountId = readField(row, ['account_id', 'account']) ?? 'default-account'
        const accountId = ensureAccount(db, sourceName, sourceAccountId, readField(row, ['account_name']) ?? sourceAccountId)
        const amountMinor = Math.abs(parseAmountMinor(amountValue))
        const direction = (readField(row, ['direction']) ?? (Number(amountValue) < 0 ? 'debit' : 'credit')).toLowerCase()
        const balanceRaw = readField(row, ['balance'])
        const dedupeHash = createHash('sha1')
          .update(`${sourceName}:${sourceAccountId}:${sourceRecordId}:${postedAt}:${description}:${amountMinor}`)
          .digest('hex')

        if (!['debit', 'credit'].includes(direction)) {
          throw new Error(`Invalid direction "${direction}"`)
        }

        upsertCore.run(
          createHash('sha1').update(dedupeHash).digest('hex').slice(0, 24),
          accountId,
          sourceName,
          sourceRecordId,
          postedAt,
          readField(row, ['settled_at']) ?? null,
          description,
          readField(row, ['merchant']) ?? null,
          readField(row, ['category']) ?? 'Uncategorised',
          readField(row, ['subcategory']) ?? null,
          amountMinor,
          readField(row, ['currency']) ?? 'AUD',
          direction,
          balanceRaw ? parseAmountMinor(balanceRaw) : null,
          readField(row, ['note', 'notes']) ?? null,
          dedupeHash
        )
        insertedCount += 1
      } catch (error) {
        rejectedCount += 1
        recordReject({
          db,
          batchId,
          domain: 'finance',
          rowNumber: index + 1,
          errorCode: 'FINANCE_NORMALIZATION_ERROR',
          errorMessage: error instanceof Error ? error.message : 'Unknown finance normalization error',
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
