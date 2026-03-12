import { createHash } from 'node:crypto';
import { basename, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
export const getFileHash = (filePath) => createHash('sha256').update(readFileSync(filePath)).digest('hex');
export const startImportBatch = ({ db, domain, sourceName, filePath }) => {
    const absolutePath = resolve(filePath);
    const sourceFileHash = getFileHash(absolutePath);
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
        .run(domain, sourceName, basename(absolutePath), sourceFileHash);
    return {
        batchId: Number(result.lastInsertRowid),
        sourceFileHash,
        absolutePath,
    };
};
export const finishImportBatch = ({ db, batchId, status, rowCount, insertedCount, rejectedCount, notes, }) => {
    db.prepare(`
    UPDATE import_batch
    SET
      status = ?,
      row_count = ?,
      inserted_count = ?,
      rejected_count = ?,
      notes = ?
    WHERE id = ?
  `).run(status, rowCount, insertedCount, rejectedCount, notes ?? null, batchId);
};
export const recordReject = ({ db, batchId, domain, rowNumber, errorCode, errorMessage, rawPayload }) => {
    db.prepare(`
    INSERT INTO import_reject (
      batch_id,
      domain,
      row_number,
      error_code,
      error_message,
      raw_payload_json
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(batchId, domain, rowNumber, errorCode, errorMessage, JSON.stringify(rawPayload));
};
