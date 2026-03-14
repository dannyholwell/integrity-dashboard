import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
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
const normalizeCsvHeader = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const parseCsvLine = (line) => {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        const nextCharacter = line[index + 1];
        if (character === '"') {
            if (inQuotes && nextCharacter === '"') {
                currentValue += '"';
                index += 1;
            }
            else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (character === ',' && !inQuotes) {
            values.push(currentValue);
            currentValue = '';
            continue;
        }
        currentValue += character;
    }
    values.push(currentValue);
    return values;
};
const parseCsvRecords = (text) => {
    const lines = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
        return [];
    }
    const headers = parseCsvLine(lines[0]).map((header) => normalizeCsvHeader(header));
    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        return headers.reduce((record, header, index) => {
            record[header] = (values[index] ?? '').trim();
            return record;
        }, {});
    });
};
const MONTH_INDEX = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
};
const normalizeDateValue = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})(?:$|[T\s])/);
    if (isoMatch) {
        return isoMatch[1];
    }
    const dayMonthYearMatch = trimmed.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{2}|\d{4})$/);
    if (dayMonthYearMatch) {
        const [, dayValue, monthToken, yearValue] = dayMonthYearMatch;
        const month = MONTH_INDEX[monthToken.toLowerCase()];
        if (!month) {
            return null;
        }
        const day = dayValue.padStart(2, '0');
        const year = yearValue.length === 2 ? `20${yearValue}` : yearValue;
        return `${year}-${month}-${day}`;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const extractDateRange = (domain, content) => {
    const records = parseCsvRecords(content);
    const dateKeys = {
        tasks: ['due_date', 'due'],
        finance: ['posted_at', 'date'],
        health: ['day', 'date'],
        mood: ['entry_at', 'timestamp'],
    };
    const dates = records
        .map((record) => {
        const key = dateKeys[domain].find((candidate) => record[candidate]);
        return key ? normalizeDateValue(record[key]) : null;
    })
        .filter((value) => value !== null)
        .sort((left, right) => left.localeCompare(right));
    return {
        dateRangeStart: dates[0] ?? null,
        dateRangeEnd: dates[dates.length - 1] ?? null,
    };
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
export const createDataManagementService = ({ db, uploadsRoot, runImport }) => {
    const listFiles = async () => {
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
        const items = await Promise.all(rows.map(async (row) => {
            if (row.date_range_start || row.date_range_end) {
                return toResponseItem(row);
            }
            const absolutePath = resolve(uploadsRoot, row.relative_path);
            try {
                const content = await readFile(absolutePath, 'utf8');
                const { dateRangeStart, dateRangeEnd } = extractDateRange(row.domain, content);
                if (dateRangeStart || dateRangeEnd) {
                    db.prepare(`
              UPDATE data_upload
              SET
                date_range_start = ?,
                date_range_end = ?
              WHERE id = ?
            `).run(dateRangeStart, dateRangeEnd, row.id);
                    return toResponseItem({
                        ...row,
                        date_range_start: dateRangeStart,
                        date_range_end: dateRangeEnd,
                    });
                }
            }
            catch {
                return toResponseItem(row);
            }
            return toResponseItem(row);
        }));
        return items;
    };
    const saveFile = async ({ domain, fileName, content, dateRangeStart, dateRangeEnd }) => {
        ensureCsvFileName(fileName);
        const safeFileName = sanitizeFileName(fileName);
        const storedFileName = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}-${safeFileName}`;
        const domainDirectory = resolve(uploadsRoot, domain);
        const relativePath = `${domain}/${storedFileName}`;
        const absolutePath = resolve(uploadsRoot, relativePath);
        let uploadId = null;
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
            uploadId = Number(result.lastInsertRowid);
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
                .get(uploadId);
            const importResult = await runImport({
                domain,
                filePath: absolutePath,
                sourceName: 'upload-ui',
            });
            return {
                item: toResponseItem(row),
                importResult,
            };
        }
        catch (error) {
            if (uploadId !== null) {
                db.prepare('DELETE FROM data_upload WHERE id = ?').run(uploadId);
            }
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
