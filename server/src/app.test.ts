import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
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
  const uploadsRoot = join(tempDir, 'imports')
  const db = openDatabase(databasePath)
  applyMigrations(db, join(process.cwd(), 'src', 'db', 'migrations'))

  return {
    db,
    uploadsRoot,
    app: buildApp(db, 'silent', uploadsRoot),
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

  it('stores, lists, and deletes uploaded CSV files', async () => {
    const { app, uploadsRoot } = createTestApp()

    const uploadResponse = await app.inject({
      method: 'POST',
      url: '/api/data-management/files',
      payload: {
        domain: 'tasks',
        fileName: 'tasks.csv',
        content: 'title,due_date\nWrite docs,2026-03-12\nReview budget,2026-03-13\n',
        dateRangeStart: '2026-03-12',
        dateRangeEnd: '2026-03-13',
      },
    })

    expect(uploadResponse.statusCode).toBe(201)

    const uploadPayload = uploadResponse.json() as {
      item: { id: number; fileName: string; storedFileName: string; dataType: string }
    }

    expect(uploadPayload.item.fileName).toBe('tasks.csv')
    expect(uploadPayload.item.dataType).toBe('tasks')
    expect(existsSync(join(uploadsRoot, 'tasks', uploadPayload.item.storedFileName))).toBe(true)
    expect(readFileSync(join(uploadsRoot, 'tasks', uploadPayload.item.storedFileName), 'utf8')).toContain('Write docs')

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/data-management/files',
    })

    expect(listResponse.statusCode).toBe(200)

    const listPayload = listResponse.json() as {
      items: Array<{ id: number; fileName: string; dateRangeStart: string | null; dateRangeEnd: string | null }>
    }

    expect(listPayload.items).toHaveLength(1)
    expect(listPayload.items[0].fileName).toBe('tasks.csv')
    expect(listPayload.items[0].dateRangeStart).toBe('2026-03-12')
    expect(listPayload.items[0].dateRangeEnd).toBe('2026-03-13')

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/data-management/files/${uploadPayload.item.id}`,
    })

    expect(deleteResponse.statusCode).toBe(200)
    expect(existsSync(join(uploadsRoot, 'tasks', uploadPayload.item.storedFileName))).toBe(false)

    await app.close()
  })
})
