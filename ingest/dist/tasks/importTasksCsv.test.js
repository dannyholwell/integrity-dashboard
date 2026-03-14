import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { applyMigrations } from '../shared/migrate.js';
import { importTasksCsv } from './importTasksCsv.js';
const cleanupPaths = [];
const createTestDb = () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'integrity-dashboard-ingest-'));
    cleanupPaths.push(tempDir);
    const databasePath = join(tempDir, 'test.sqlite');
    const db = new Database(databasePath);
    db.pragma('foreign_keys = ON');
    applyMigrations(db);
    return { db, tempDir };
};
afterEach(() => {
    while (cleanupPaths.length > 0) {
        const target = cleanupPaths.pop();
        if (target) {
            rmSync(target, { force: true, recursive: true });
        }
    }
});
describe('importTasksCsv', () => {
    it('imports valid rows and records rejects for invalid rows', () => {
        const { db, tempDir } = createTestDb();
        const csvPath = join(tempDir, 'tasks.csv');
        writeFileSync(csvPath, [
            'id,title,category,effort,status,due_date,source_path,summary',
            'new-task-1,Test Task,Systems,high,ready,2026-03-12,Projects/Test.md,Valid row',
            'new-task-1,Test Task,Systems,high,ready,2026-03-12,Projects/Test.md,Valid row',
            'broken-task,,Systems,unknown,ready,2026-03-13,Projects/Broken.md,Invalid row',
        ].join('\n'));
        const result = importTasksCsv(db, csvPath, 'test-source');
        expect(result.rowCount).toBe(3);
        expect(result.insertedCount).toBe(1);
        expect(result.skippedCount).toBe(1);
        expect(result.rejectedCount).toBe(1);
        const importedTask = db
            .prepare(`
        SELECT title, source_system
        FROM core_task
        WHERE source_system = 'test-source'
      `)
            .get();
        expect(importedTask.title).toBe('Test Task');
        const rejectCount = db.prepare('SELECT COUNT(*) AS count FROM import_reject').get();
        expect(rejectCount.count).toBe(1);
    });
});
