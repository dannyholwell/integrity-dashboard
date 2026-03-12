import { CATEGORY_BREAKDOWN_QUERY, RECENT_SPEND_QUERY } from '../db/sql/financeQueries.js';
const CATEGORY_COLORS = {
    'Cafe & coffee': '#f59e0b',
    Groceries: '#10b981',
    'Internal transfers': '#64748b',
    'Other shopping': '#8b5cf6',
    'Recovery/Health': '#3b82f6',
    'Restaurants & takeaway': '#f97316',
    Rent: '#6366f1',
    Subscriptions: '#f59e0b',
    'Transfers out': '#06b6d4',
    Discretionary: '#ef4444',
};
const toCurrency = (minor) => Number((minor / 100).toFixed(2));
export const createFinanceService = (db) => {
    const getFinanceOverview = () => {
        const totalBalanceRow = db
            .prepare(`
        SELECT COALESCE(SUM((
          SELECT txn.balance_minor
          FROM core_transaction txn
          WHERE txn.account_id = acct.id
            AND txn.balance_minor IS NOT NULL
          ORDER BY txn.posted_at DESC, txn.id DESC
          LIMIT 1
        )), 0) AS total_balance_minor
        FROM core_account acct
        WHERE acct.is_active = 1
      `)
            .get();
        const monthSpendRow = db
            .prepare(`
        SELECT COALESCE(SUM(amount_minor), 0) AS spend_minor
        FROM core_transaction
        WHERE direction = 'debit'
          AND posted_at >= date('now', 'localtime', 'start of month')
      `)
            .get();
        const recentSpendRows = db.prepare(RECENT_SPEND_QUERY).all();
        const categoryRows = db.prepare(CATEGORY_BREAKDOWN_QUERY).all();
        const remainingDays = Math.max(1, Number(db.prepare(`
      SELECT CAST(strftime('%d', date('now', 'localtime', 'start of month', '+1 month', '-1 day')) AS INTEGER)
        - CAST(strftime('%d', 'now', 'localtime') AS INTEGER)
        + 1 AS remaining_days
    `).pluck().get()));
        const monthlyBudgetMinor = 168400;
        const remainingBudgetMinor = Math.max(0, monthlyBudgetMinor - (monthSpendRow.spend_minor ?? 0));
        return {
            totalBalance: toCurrency(totalBalanceRow.total_balance_minor ?? 0),
            dailyBudgetLeft: toCurrency(Math.round(remainingBudgetMinor / remainingDays)),
            allocation: categoryRows.map((row) => ({
                name: row.name,
                value: toCurrency(row.value_minor),
                color: CATEGORY_COLORS[row.name] ?? '#94a3b8',
            })),
            recentDailySpend: recentSpendRows.map((row) => ({
                day: new Date(`${row.day}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'short' }),
                spend: toCurrency(row.spend_minor),
            })),
        };
    };
    const listTransactions = (query = {}) => {
        const filters = [];
        const params = [];
        if (query.category) {
            filters.push('category = ?');
            params.push(query.category);
        }
        if (query.from) {
            filters.push('posted_at >= ?');
            params.push(query.from);
        }
        if (query.to) {
            filters.push('posted_at <= ?');
            params.push(query.to);
        }
        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
        const limit = query.limit ?? 20;
        params.push(limit);
        const rows = db
            .prepare(`
        SELECT
          id,
          posted_at,
          description,
          merchant,
          category,
          amount_minor,
          currency,
          direction
        FROM core_transaction
        ${whereClause}
        ORDER BY posted_at DESC, id DESC
        LIMIT ?
      `)
            .all(...params);
        return rows.map((row) => ({
            id: row.id,
            postedAt: row.posted_at,
            description: row.description,
            merchant: row.merchant,
            category: row.category,
            amount: toCurrency(row.amount_minor),
            currency: row.currency,
            direction: row.direction,
        }));
    };
    return {
        getFinanceOverview,
        listTransactions,
    };
};
