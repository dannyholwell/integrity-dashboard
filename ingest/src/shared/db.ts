import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const projectRoot = resolve(fileURLToPath(new URL('../../..', import.meta.url)))

export const getDatabasePath = () => process.env.DATABASE_PATH ?? resolve(projectRoot, 'data', 'integrity-dashboard.sqlite')

export const openDatabase = () => {
  const db = new Database(getDatabasePath())

  db.pragma('foreign_keys = ON')
  db.pragma('journal_mode = WAL')

  return db
}

export type AppDatabase = ReturnType<typeof openDatabase>
