import { readCsvFile } from '../shared/csv.js';
import { hashParts } from '../shared/hash.js';
import { finishImportBatch, recordReject, startImportBatch } from '../shared/importBatch.js';
import { runNormalization } from '../normalize/runNormalization.js';
const readField = (row, keys) => {
    for (const key of keys) {
        const value = row[key];
        if (value !== undefined && value !== '') {
            return value;
        }
    }
    return undefined;
};
const parseAmountNumber = (value) => Number(value.replace(/[^0-9.-]/g, ''));
const parseAmountMinor = (value) => Math.round(parseAmountNumber(value) * 100);
const MONTH_INDEX = {
    Jan: '01',
    Feb: '02',
    Mar: '03',
    Apr: '04',
    May: '05',
    Jun: '06',
    Jul: '07',
    Aug: '08',
    Sep: '09',
    Oct: '10',
    Nov: '11',
    Dec: '12',
};
const normalizePostedDate = (value) => {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }
    const dayMonthYearMatch = trimmed.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{2}|\d{4})$/);
    if (!dayMonthYearMatch) {
        return trimmed;
    }
    const [, dayValue, monthToken, yearValue] = dayMonthYearMatch;
    const month = MONTH_INDEX[monthToken];
    if (!month) {
        return trimmed;
    }
    const day = dayValue.padStart(2, '0');
    const year = yearValue.length === 2 ? `20${yearValue}` : yearValue;
    return `${year}-${month}-${day}`;
};
const buildFallbackTransactionSourceRecordId = (sourceAccountId, postedAt, description, amountMinor, direction) => `txn-${hashParts([sourceAccountId, postedAt, description, amountMinor, direction]).slice(0, 16)}`;
const ensureAccount = (db, sourceName, sourceAccountId, accountName) => {
    const accountId = hashParts([sourceName, sourceAccountId]).slice(0, 24);
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
  `).run(accountId, sourceName, sourceAccountId, accountName, sourceName, 'transaction');
    return accountId;
};
export const importTransactionsCsv = (db, filePath, sourceName) => {
    const { batchId, absolutePath } = startImportBatch({
        db,
        domain: 'finance',
        sourceName,
        filePath,
    });
    const rows = readCsvFile(absolutePath);
    let insertedCount = 0;
    let skippedCount = 0;
    let rejectedCount = 0;
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
  `);
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
      account_id = excluded.account_id,
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
      dedupe_hash = excluded.dedupe_hash,
      updated_at = CURRENT_TIMESTAMP
    WHERE
      core_transaction.account_id IS NOT excluded.account_id
      OR core_transaction.posted_at IS NOT excluded.posted_at
      OR core_transaction.settled_at IS NOT excluded.settled_at
      OR core_transaction.description IS NOT excluded.description
      OR core_transaction.merchant IS NOT excluded.merchant
      OR core_transaction.category IS NOT excluded.category
      OR core_transaction.subcategory IS NOT excluded.subcategory
      OR core_transaction.amount_minor IS NOT excluded.amount_minor
      OR core_transaction.currency IS NOT excluded.currency
      OR core_transaction.direction IS NOT excluded.direction
      OR core_transaction.balance_minor IS NOT excluded.balance_minor
      OR core_transaction.note IS NOT excluded.note
      OR core_transaction.dedupe_hash IS NOT excluded.dedupe_hash
  `);
    const transaction = db.transaction(() => {
        rows.forEach((row, index) => {
            insertRaw.run(batchId, index + 1, readField(row, ['source_record_id', 'id', 'Reference']) ?? null, readField(row, ['account_id', 'account', 'Account Number']) ?? null, readField(row, ['posted_at', 'date', 'Date']) ?? null, readField(row, ['description', 'Transaction Details']) ?? null, readField(row, ['amount', 'Amount']) ?? null, readField(row, ['balance', 'Balance']) ?? null, readField(row, ['category', 'Category']) ?? null, JSON.stringify(row));
            try {
                const postedAtRaw = readField(row, ['posted_at', 'date', 'Date']);
                const description = readField(row, ['description', 'Transaction Details']);
                const amountValue = readField(row, ['amount', 'Amount']);
                if (!postedAtRaw || !description || !amountValue) {
                    throw new Error('Missing required finance fields');
                }
                const postedAt = normalizePostedDate(postedAtRaw);
                const settledAtRaw = readField(row, ['settled_at', 'Processed On']);
                const sourceAccountId = readField(row, ['account_id', 'account', 'Account Number']) ?? 'default-account';
                const amountMinor = Math.abs(parseAmountMinor(amountValue));
                const direction = (readField(row, ['direction', 'Direction']) ?? (parseAmountNumber(amountValue) < 0 ? 'debit' : 'credit')).toLowerCase();
                const balanceRaw = readField(row, ['balance', 'Balance']);
                if (!['debit', 'credit'].includes(direction)) {
                    throw new Error(`Invalid direction "${direction}"`);
                }
                const sourceRecordId = readField(row, ['source_record_id', 'id', 'Reference']) ??
                    buildFallbackTransactionSourceRecordId(sourceAccountId, postedAt, description, amountMinor, direction);
                const accountId = ensureAccount(db, sourceName, sourceAccountId, readField(row, ['account_name', 'Account Name']) ?? sourceAccountId);
                const dedupeHash = hashParts([sourceName, sourceAccountId, sourceRecordId, postedAt, description, amountMinor, direction]);
                const result = upsertCore.run(hashParts([sourceName, sourceRecordId]).slice(0, 24), accountId, sourceName, sourceRecordId, postedAt, settledAtRaw ? normalizePostedDate(settledAtRaw) : null, description, readField(row, ['merchant', 'Merchant Name']) ?? null, readField(row, ['category', 'Category']) ?? 'Uncategorised', readField(row, ['subcategory', 'Transaction Type']) ?? null, amountMinor, readField(row, ['currency']) ?? 'AUD', direction, balanceRaw ? parseAmountMinor(balanceRaw) : null, readField(row, ['note', 'notes']) ?? null, dedupeHash);
                if (result.changes > 0) {
                    insertedCount += 1;
                }
                else {
                    skippedCount += 1;
                }
            }
            catch (error) {
                rejectedCount += 1;
                recordReject({
                    db,
                    batchId,
                    domain: 'finance',
                    rowNumber: index + 1,
                    errorCode: 'FINANCE_NORMALIZATION_ERROR',
                    errorMessage: error instanceof Error ? error.message : 'Unknown finance normalization error',
                    rawPayload: row,
                });
            }
        });
    });
    try {
        transaction();
        runNormalization(db);
        finishImportBatch({
            db,
            batchId,
            status: rejectedCount > 0 ? 'completed_with_rejects' : 'completed',
            rowCount: rows.length,
            insertedCount,
            skippedCount,
            rejectedCount,
        });
    }
    catch (error) {
        finishImportBatch({
            db,
            batchId,
            status: 'failed',
            rowCount: rows.length,
            insertedCount,
            skippedCount,
            rejectedCount,
            notes: error instanceof Error ? error.message : 'Unknown import failure',
        });
        throw error;
    }
    return { rowCount: rows.length, insertedCount, skippedCount, rejectedCount };
};
