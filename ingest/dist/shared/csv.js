import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
export const readCsvFile = (filePath) => parse(readFileSync(filePath, 'utf8'), {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
});
