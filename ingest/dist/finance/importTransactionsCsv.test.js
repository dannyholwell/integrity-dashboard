import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { applyMigrations } from '../shared/migrate.js';
import { importTransactionsCsv } from './importTransactionsCsv.js';
const cleanupPaths = [];
const createTestDb = () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'integrity-dashboard-finance-ingest-'));
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
describe('importTransactionsCsv', () => {
    it('imports bank-export headers and normalizes non-ISO dates', () => {
        const { db, tempDir } = createTestDb();
        const csvPath = join(tempDir, 'transactions.csv');
        writeFileSync(csvPath, [
            'Date,Amount,Account Number,,Transaction Type,Transaction Details,Balance,Category,Merchant Name,Processed On',
            '12 Mar 26,-28.67,168699150,,EFTPOS DEBIT,POS 12/03 UBER EATS,840.38,Restaurants & takeaway,Uber Eats,',
            '11 Mar 26,-525.00,168699150,,TRANSFER DEBIT,DAVINA GUTTMAN H0660038311 Rent,1143.22,Transfers out,,11 Mar 26',
        ].join('\n'));
        const result = importTransactionsCsv(db, csvPath, 'bank-export');
        expect(result.rowCount).toBe(2);
        expect(result.insertedCount).toBe(2);
        expect(result.rejectedCount).toBe(0);
        const rows = db
            .prepare(`
        SELECT posted_at, settled_at, description, merchant, category, subcategory, direction, amount_minor
        FROM core_transaction
        WHERE source_system = 'bank-export'
        ORDER BY posted_at DESC, id DESC
      `)
            .all();
        expect(rows).toHaveLength(2);
        expect(rows[0].posted_at).toBe('2026-03-12');
        expect(rows[0].merchant).toBe('Uber Eats');
        expect(rows[0].subcategory).toBe('EFTPOS DEBIT');
        expect(rows[0].direction).toBe('debit');
        expect(rows[0].amount_minor).toBe(2867);
        expect(rows[1].posted_at).toBe('2026-03-11');
        expect(rows[1].settled_at).toBe('2026-03-11');
        expect(rows[1].category).toBe('Transfers out');
    });
});
