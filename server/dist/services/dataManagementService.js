import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { extname, resolve } from 'node:path';
const sanitizeFileName = (fileName) => {
    const trimmed = fileName.trim();
    const replaced = trimmed.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-');
    const normalized = replaced.replace(/^-+|-+$/g, '');
    return normalized || 'upload.csv';
};
const ensureCsvFileName = (fileName) => {
    if (extname(fileName).toLowerCase() !== '.csv') {
        throw new Error('Only .csv files can be uploaded');
    }
};
const toResponseItem = (row) => ({
    id: row.id,
    fileName: row.original_file_name,
    dataType: row.domain,
    uploadedAt: row.uploaded_at,
    dateRangeStart: row.date_range_start,
    dateRangeEnd: row.date_range_end,
    fileSizeBytes: row.file_size_bytes,
    storedFileName: row.stored_file_name,
});
export const createDataManagementService = ({ db, uploadsRoot }) => {
    const listFiles = () => {
        const rows = db
            .prepare(`
        SELECT
          id,
          domain,
          original_file_name,
          stored_file_name,
          relative_path,
          file_size_bytes,
          date_range_start,
          date_range_end,
          uploaded_at
        FROM data_upload
        ORDER BY uploaded_at DESC, id DESC
      `)
            .all();
        return rows.map(toResponseItem);
    };
    const saveFile = async ({ domain, fileName, content, dateRangeStart, dateRangeEnd }) => {
        ensureCsvFileName(fileName);
        const safeFileName = sanitizeFileName(fileName);
        const storedFileName = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}-${safeFileName}`;
        const domainDirectory = resolve(uploadsRoot, domain);
        const relativePath = `${domain}/${storedFileName}`;
        const absolutePath = resolve(uploadsRoot, relativePath);
        await mkdir(domainDirectory, { recursive: true });
        await writeFile(absolutePath, content, 'utf8');
        try {
            const result = db
                .prepare(`
          INSERT INTO data_upload (
            domain,
            original_file_name,
            stored_file_name,
            relative_path,
            file_size_bytes,
            date_range_start,
            date_range_end
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
                .run(domain, fileName.trim(), storedFileName, relativePath, Buffer.byteLength(content, 'utf8'), dateRangeStart ?? null, dateRangeEnd ?? null);
            const row = db
                .prepare(`
          SELECT
            id,
            domain,
            original_file_name,
            stored_file_name,
            relative_path,
            file_size_bytes,
            date_range_start,
            date_range_end,
            uploaded_at
          FROM data_upload
          WHERE id = ?
        `)
                .get(Number(result.lastInsertRowid));
            return toResponseItem(row);
        }
        catch (error) {
            await unlink(absolutePath).catch(() => undefined);
            throw error;
        }
    };
    const deleteFile = async (id) => {
        const row = db
            .prepare(`
        SELECT
          id,
          domain,
          original_file_name,
          stored_file_name,
          relative_path,
          file_size_bytes,
          date_range_start,
          date_range_end,
          uploaded_at
        FROM data_upload
        WHERE id = ?
      `)
            .get(id);
        if (!row) {
            throw new Error('Upload not found');
        }
        const absolutePath = resolve(uploadsRoot, row.relative_path);
        await unlink(absolutePath).catch((error) => {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        });
        db.prepare('DELETE FROM data_upload WHERE id = ?').run(id);
        return toResponseItem(row);
    };
    return {
        listFiles,
        saveFile,
        deleteFile,
    };
};
