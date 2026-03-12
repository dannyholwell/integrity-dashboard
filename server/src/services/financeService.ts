import type { AppDatabase } from '../db/connection.js'
import { CATEGORY_BREAKDOWN_QUERY, RECENT_SPEND_QUERY } from '../db/sql/financeQueries.js'
import type { FinanceTransactionsQuery, FinanceTransactionUpdate } from '../schemas/finance.js'

const CATEGORY_COLORS: Record<string, string> = {
  Alcohol: '#ec4899',
  'Cafe & coffee': '#f59e0b',
  'Credit card repayments': '#475569',
  Donations: '#14b8a6',
  'Electronics & technology': '#7c3aed',
  Fees: '#ef4444',
  Groceries: '#10b981',
  'Internal transfers': '#eab308',
  Medical: '#22c55e',
  Media: '#a855f7',
  'Other shopping': '#8b5cf6',
  'Parking & tolls': '#f97316',
  'Personal care': '#fb7185',
  'Phone & internet': '#3b82f6',
  'Public transport': '#0ea5e9',
  'Recovery/Health': '#3b82f6',
  'Restaurants & takeaway': '#f97316',
  Rent: '#6366f1',
  Subscriptions: '#f59e0b',
  'Transfers out': '#06b6d4',
  Uncategorised: '#94a3b8',
  Discretionary: '#ef4444',
}

const toCurrency = (minor: number) => Number((minor / 100).toFixed(2))
const DAY_IN_MS = 24 * 60 * 60 * 1000
const getLocalDateKey = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getLastSevenDaysSpend = (rows: Array<{ day: string; spend_minor: number }>) => {
  const spendByDay = new Map(rows.map((row) => [row.day, row.spend_minor]))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today.getTime() - (6 - index) * DAY_IN_MS)
    const dayKey = getLocalDateKey(day)

    return {
      day: day.toLocaleDateString('en-AU', { weekday: 'short' }),
      spend: toCurrency(spendByDay.get(dayKey) ?? 0),
    }
  })
}

export const createFinanceService = (db: AppDatabase) => {
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
      .get() as { total_balance_minor: number | null }

    const monthSpendRow = db
      .prepare(`
        SELECT COALESCE(SUM(amount_minor), 0) AS spend_minor
        FROM core_transaction
        WHERE direction = 'debit'
          AND COALESCE(category, '') <> 'Internal transfers'
          AND posted_at >= date('now', 'localtime', 'start of month')
      `)
      .get() as { spend_minor: number | null }

    const recentSpendRows = db.prepare(RECENT_SPEND_QUERY).all() as Array<{ day: string; spend_minor: number }>
    const categoryRows = db.prepare(CATEGORY_BREAKDOWN_QUERY).all() as Array<{ name: string; value_minor: number }>

    const remainingDays = Math.max(1, Number(db.prepare(`
      SELECT CAST(strftime('%d', date('now', 'localtime', 'start of month', '+1 month', '-1 day')) AS INTEGER)
        - CAST(strftime('%d', 'now', 'localtime') AS INTEGER)
        + 1 AS remaining_days
    `).pluck().get()))
    const monthlyBudgetMinor = 168400
    const remainingBudgetMinor = Math.max(0, monthlyBudgetMinor - (monthSpendRow.spend_minor ?? 0))

    return {
      totalBalance: toCurrency(totalBalanceRow.total_balance_minor ?? 0),
      dailyBudgetLeft: toCurrency(Math.round(remainingBudgetMinor / remainingDays)),
      allocation: categoryRows.map((row) => ({
        name: row.name,
        value: toCurrency(row.value_minor),
        color: CATEGORY_COLORS[row.name] ?? '#94a3b8',
      })),
      recentDailySpend: getLastSevenDaysSpend(recentSpendRows),
    }
  }

  const listTransactions = (query: FinanceTransactionsQuery = {}) => {
    const filters: string[] = []
    const params: Array<string | number> = []

    if (query.category) {
      filters.push('category = ?')
      params.push(query.category)
    }

    if (query.from) {
      filters.push('posted_at >= ?')
      params.push(query.from)
    }

    if (query.to) {
      filters.push('posted_at <= ?')
      params.push(query.to)
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''
    const limit = query.limit ?? 20
    params.push(limit)

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
      .all(...params) as Array<{
      id: string
      posted_at: string
      description: string
      merchant: string | null
      category: string
      amount_minor: number
      currency: string
      direction: 'debit' | 'credit'
    }>

    return rows.map((row) => ({
      id: row.id,
      postedAt: row.posted_at,
      description: row.description,
      merchant: row.merchant,
      category: row.category,
      amount: toCurrency(row.amount_minor),
      currency: row.currency,
      direction: row.direction,
    }))
  }

  const updateTransaction = (id: string, update: FinanceTransactionUpdate) => {
    const existing = db
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
        WHERE id = ?
      `)
      .get(id) as
      | {
          id: string
          posted_at: string
          description: string
          merchant: string | null
          category: string
          amount_minor: number
          currency: string
          direction: 'debit' | 'credit'
        }
      | undefined

    if (!existing) {
      throw new Error('Transaction not found')
    }

    const merchant = update.merchant === undefined ? existing.merchant : update.merchant
    const category = update.category ?? existing.category

    db.prepare(`
      UPDATE core_transaction
      SET
        merchant = ?,
        category = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(merchant, category, id)

    return {
      id: existing.id,
      postedAt: existing.posted_at,
      description: existing.description,
      merchant,
      category,
      amount: toCurrency(existing.amount_minor),
      currency: existing.currency,
      direction: existing.direction,
    }
  }

  return {
    getFinanceOverview,
    listTransactions,
    updateTransaction,
  }
}
