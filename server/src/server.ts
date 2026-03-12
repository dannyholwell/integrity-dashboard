import { buildApp } from './app.js'
import { env } from './config/env.js'
import { openDatabase } from './db/connection.js'
import { applyMigrations } from './db/migrate.js'
import { createImportRunner } from './lib/runImport.js'

const migrationsDirectory = `${env.projectRoot}/server/src/db/migrations`
const uploadsRoot = `${env.projectRoot}/data/imports`
const runImport = createImportRunner({
  databasePath: env.databasePath,
  projectRoot: env.projectRoot,
})

const start = async () => {
  const db = openDatabase(env.databasePath)
  applyMigrations(db, migrationsDirectory)

  const app = buildApp(db, env.logLevel, uploadsRoot, runImport)

  try {
    await app.listen({
      host: env.host,
      port: env.port,
    })
  } catch (error) {
    app.log.error(error)
    process.exitCode = 1
  }
}

void start()
