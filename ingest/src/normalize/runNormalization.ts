import type { AppDatabase } from '../shared/db.js'

export const runNormalization = (_db: AppDatabase) => {
  // SQLite views update automatically. Keep this hook for future derived tables.
  return { refreshed: true }
}
