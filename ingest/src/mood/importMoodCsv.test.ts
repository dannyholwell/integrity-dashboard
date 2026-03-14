import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { applyMigrations } from '../shared/migrate.js'
import { importMoodCsv } from './importMoodCsv.js'

const cleanupPaths: string[] = []

const createTestDb = () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'integrity-dashboard-mood-ingest-'))
  cleanupPaths.push(tempDir)

  const databasePath = join(tempDir, 'test.sqlite')
  const db = new Database(databasePath)

  db.pragma('foreign_keys = ON')
  applyMigrations(db)

  return { db, tempDir }
}

afterEach(() => {
  while (cleanupPaths.length > 0) {
    const target = cleanupPaths.pop()
    if (target) {
      rmSync(target, { force: true, recursive: true })
    }
  }
})

describe('importMoodCsv', () => {
  it('skips duplicate mood rows', () => {
    const { db, tempDir } = createTestDb()
    const csvPath = join(tempDir, 'mood.csv')

    writeFileSync(
      csvPath,
      [
        'entry_at,mood_score,energy_score,stress_score,tags,note',
        '2026-03-12T08:30:00,4.5,4,2,focused|calm,Strong morning',
        '2026-03-12T08:30:00,4.5,4,2,focused|calm,Strong morning',
        '2026-03-12T20:00:00,3.5,3,4,tired,Long day',
      ].join('\n')
    )

    const result = importMoodCsv(db, csvPath, 'mood-export')

    expect(result.rowCount).toBe(3)
    expect(result.insertedCount).toBe(2)
    expect(result.skippedCount).toBe(1)
    expect(result.rejectedCount).toBe(0)

    const rows = db
      .prepare(`
        SELECT entry_at, mood_score
        FROM core_mood_entry
        WHERE source_system = 'mood-export'
        ORDER BY entry_at
      `)
      .all() as Array<{ entry_at: string; mood_score: number }>

    expect(rows).toHaveLength(2)
    expect(rows[0].entry_at).toBe('2026-03-12T08:30:00')
    expect(rows[1].entry_at).toBe('2026-03-12T20:00:00')
  })
})
