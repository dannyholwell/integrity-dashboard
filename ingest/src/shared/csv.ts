import { readFileSync } from 'node:fs'
import { parse } from 'csv-parse/sync'

export type CsvRecord = Record<string, string>

export const readCsvFile = (filePath: string) =>
  parse(readFileSync(filePath, 'utf8'), {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRecord[]
