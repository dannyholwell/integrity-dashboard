import { readdirSync, readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AppDatabase } from './db.js'

const migrationsDirectory = resolve(fileURLToPath(new URL('../../../server/src/db/migrations', import.meta.url)))

const ensureMigrationTable = (db: AppDatabase) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export const applyMigrations = (db: AppDatabase) => {
  ensureMigrationTable(db)

  const applied = new Set<string>(
    db
      .prepare('SELECT filename FROM schema_migration ORDER BY filename')
      .all()
      .map((row) => String((row as { filename: string }).filename))
  )

  const files = readdirSync(migrationsDirectory)
    .filter((entry) => extname(entry) === '.sql')
    .sort((left, right) => left.localeCompare(right))

  for (const file of files) {
    if (applied.has(file)) {
      continue
    }

    const sql = readFileSync(resolve(migrationsDirectory, file), 'utf8')

    db.transaction(() => {
      db.exec(sql)
      db.prepare('INSERT INTO schema_migration (filename) VALUES (?)').run(file)
    })()
  }
}
