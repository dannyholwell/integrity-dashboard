import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { applyMigrations } from '../shared/migrate.js';
import { importHealthCsv } from './importHealthCsv.js';
const cleanupPaths = [];
const createTestDb = () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'integrity-dashboard-health-ingest-'));
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
describe('importHealthCsv', () => {
    it('skips duplicate health rows', () => {
        const { db, tempDir } = createTestDb();
        const csvPath = join(tempDir, 'health.csv');
        writeFileSync(csvPath, [
            'day,steps,active_calories,resting_heart_rate,hrv_ms,sleep_minutes,workout_minutes,oxygen_saturation_pct',
            '2026-03-12,8000,2300,58,62,450,45,98',
            '2026-03-12,8000,2300,58,62,450,45,98',
            '2026-03-13,9200,2450,56,68,470,60,99',
        ].join('\n'));
        const result = importHealthCsv(db, csvPath, 'health-export');
        expect(result.rowCount).toBe(3);
        expect(result.insertedCount).toBe(2);
        expect(result.skippedCount).toBe(1);
        expect(result.rejectedCount).toBe(0);
        const rows = db
            .prepare(`
        SELECT day, steps
        FROM core_daily_health
        WHERE source_system = 'health-export'
        ORDER BY day
      `)
            .all();
        expect(rows).toHaveLength(2);
        expect(rows[0].day).toBe('2026-03-12');
        expect(rows[1].day).toBe('2026-03-13');
    });
});
