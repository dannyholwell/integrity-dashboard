import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from './app.js'
import { openDatabase } from './db/connection.js'
import { applyMigrations } from './db/migrate.js'

const cleanupPaths: string[] = []

const createTestApp = () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'integrity-dashboard-server-'))
  cleanupPaths.push(tempDir)

  const databasePath = join(tempDir, 'test.sqlite')
  const db = openDatabase(databasePath)
  applyMigrations(db, join(process.cwd(), 'src', 'db', 'migrations'))

  return {
    db,
    app: buildApp(db, 'silent'),
  }
}

afterEach(() => {
  while (cleanupPaths.length > 0) {
    const target = cleanupPaths.pop()
    if (target) {
      rmSync(target, { force: true, recursive: true })
    }
  }
})

describe('buildApp', () => {
  it('returns task records through the local API', async () => {
    const { app } = createTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/tasks',
    })

    expect(response.statusCode).toBe(200)

    const payload = response.json() as { items: Array<{ title: string; sourceId: string }> }
    expect(payload.items.length).toBeGreaterThan(0)
    expect(payload.items[0]).toHaveProperty('title')
    expect(payload.items[0].sourceId).toContain(':')

    await app.close()
  })

  it('returns the dashboard summary shape used by the frontend', async () => {
    const { app } = createTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/summary',
    })

    expect(response.statusCode).toBe(200)

    const payload = response.json() as {
      finance: { totalBalance: number; allocation: unknown[] }
      health: { daily: unknown[] }
      mood: { currentScore: number }
      nextEvent: { title: string }
    }

    expect(payload.finance.totalBalance).toBeGreaterThan(0)
    expect(payload.finance.allocation.length).toBeGreaterThan(0)
    expect(payload.health.daily.length).toBe(7)
    expect(payload.mood.currentScore).toBeGreaterThan(0)
    expect(payload.nextEvent.title).toBeTruthy()

    await app.close()
  })
})
