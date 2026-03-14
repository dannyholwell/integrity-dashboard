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
const toNumberOrNull = (value) => (value === undefined ? null : Number(value));
const buildFallbackMoodSourceRecordId = (entryAt) => `mood-${hashParts([entryAt]).slice(0, 16)}`;
export const importMoodCsv = (db, filePath, sourceName) => {
    const { batchId, absolutePath } = startImportBatch({
        db,
        domain: 'mood',
        sourceName,
        filePath,
    });
    const rows = readCsvFile(absolutePath);
    let insertedCount = 0;
    let skippedCount = 0;
    let rejectedCount = 0;
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
  `);
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
    WHERE
      core_mood_entry.entry_at IS NOT excluded.entry_at
      OR core_mood_entry.day IS NOT excluded.day
      OR core_mood_entry.mood_score IS NOT excluded.mood_score
      OR core_mood_entry.energy_score IS NOT excluded.energy_score
      OR core_mood_entry.stress_score IS NOT excluded.stress_score
      OR core_mood_entry.tags_json IS NOT excluded.tags_json
      OR core_mood_entry.note IS NOT excluded.note
  `);
    const transaction = db.transaction(() => {
        rows.forEach((row, index) => {
            insertRaw.run(batchId, index + 1, readField(row, ['source_record_id', 'id']) ?? null, readField(row, ['entry_at', 'timestamp']) ?? null, readField(row, ['mood_score', 'mood']) ?? null, readField(row, ['energy_score', 'energy']) ?? null, readField(row, ['stress_score', 'stress']) ?? null, readField(row, ['tags']) ?? null, readField(row, ['note', 'notes']) ?? null, JSON.stringify(row));
            try {
                const entryAt = readField(row, ['entry_at', 'timestamp']);
                const moodScore = readField(row, ['mood_score', 'mood']);
                if (!entryAt || !moodScore) {
                    throw new Error('Missing mood entry timestamp or score');
                }
                const sourceRecordId = readField(row, ['source_record_id', 'id']) ?? buildFallbackMoodSourceRecordId(entryAt);
                const entryDate = entryAt.slice(0, 10);
                const stableId = hashParts([sourceName, sourceRecordId]).slice(0, 24);
                const tagsJson = JSON.stringify((readField(row, ['tags']) ?? '')
                    .split('|')
                    .map((tag) => tag.trim())
                    .filter(Boolean));
                const result = upsertCore.run(stableId, sourceName, sourceRecordId, entryAt, entryDate, Number(moodScore), toNumberOrNull(readField(row, ['energy_score', 'energy'])), toNumberOrNull(readField(row, ['stress_score', 'stress'])), tagsJson, readField(row, ['note', 'notes']) ?? null);
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
                    domain: 'mood',
                    rowNumber: index + 1,
                    errorCode: 'MOOD_NORMALIZATION_ERROR',
                    errorMessage: error instanceof Error ? error.message : 'Unknown mood normalization error',
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
