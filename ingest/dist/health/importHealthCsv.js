import { readCsvFile } from '../shared/csv.js';
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
export const importHealthCsv = (db, filePath, sourceName) => {
    const { batchId, absolutePath } = startImportBatch({
        db,
        domain: 'health',
        sourceName,
        filePath,
    });
    const rows = readCsvFile(absolutePath);
    let insertedCount = 0;
    let skippedCount = 0;
    let rejectedCount = 0;
    const insertRaw = db.prepare(`
    INSERT INTO raw_health_import (
      batch_id,
      row_number,
      source_record_id,
      day_raw,
      metric_payload_json,
      raw_payload_json
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
    const upsertCore = db.prepare(`
    INSERT INTO core_daily_health (
      day,
      source_system,
      steps,
      active_calories,
      resting_heart_rate,
      hrv_ms,
      sleep_minutes,
      workout_minutes,
      body_weight_kg,
      recovery_score,
      oxygen_saturation_pct
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(day) DO UPDATE SET
      source_system = excluded.source_system,
      steps = excluded.steps,
      active_calories = excluded.active_calories,
      resting_heart_rate = excluded.resting_heart_rate,
      hrv_ms = excluded.hrv_ms,
      sleep_minutes = excluded.sleep_minutes,
      workout_minutes = excluded.workout_minutes,
      body_weight_kg = excluded.body_weight_kg,
      recovery_score = excluded.recovery_score,
      oxygen_saturation_pct = excluded.oxygen_saturation_pct,
      updated_at = CURRENT_TIMESTAMP
    WHERE
      core_daily_health.source_system IS NOT excluded.source_system
      OR core_daily_health.steps IS NOT excluded.steps
      OR core_daily_health.active_calories IS NOT excluded.active_calories
      OR core_daily_health.resting_heart_rate IS NOT excluded.resting_heart_rate
      OR core_daily_health.hrv_ms IS NOT excluded.hrv_ms
      OR core_daily_health.sleep_minutes IS NOT excluded.sleep_minutes
      OR core_daily_health.workout_minutes IS NOT excluded.workout_minutes
      OR core_daily_health.body_weight_kg IS NOT excluded.body_weight_kg
      OR core_daily_health.recovery_score IS NOT excluded.recovery_score
      OR core_daily_health.oxygen_saturation_pct IS NOT excluded.oxygen_saturation_pct
  `);
    const transaction = db.transaction(() => {
        rows.forEach((row, index) => {
            insertRaw.run(batchId, index + 1, readField(row, ['source_record_id', 'id']) ?? null, readField(row, ['day', 'date']) ?? null, JSON.stringify({
                steps: readField(row, ['steps']),
                active_calories: readField(row, ['active_calories', 'calories']),
                hrv_ms: readField(row, ['hrv_ms', 'hrv']),
            }), JSON.stringify(row));
            try {
                const day = readField(row, ['day', 'date']);
                if (!day) {
                    throw new Error('Missing health day/date');
                }
                const result = upsertCore.run(day, sourceName, Number(readField(row, ['steps']) ?? 0), toNumberOrNull(readField(row, ['active_calories', 'calories'])), toNumberOrNull(readField(row, ['resting_heart_rate', 'resting_hr'])), toNumberOrNull(readField(row, ['hrv_ms', 'hrv'])), toNumberOrNull(readField(row, ['sleep_minutes'])), toNumberOrNull(readField(row, ['workout_minutes'])), toNumberOrNull(readField(row, ['body_weight_kg'])), toNumberOrNull(readField(row, ['recovery_score'])), toNumberOrNull(readField(row, ['oxygen_saturation_pct', 'oxygen'])));
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
                    domain: 'health',
                    rowNumber: index + 1,
                    errorCode: 'HEALTH_NORMALIZATION_ERROR',
                    errorMessage: error instanceof Error ? error.message : 'Unknown health normalization error',
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
