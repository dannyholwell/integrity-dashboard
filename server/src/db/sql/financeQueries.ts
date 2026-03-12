export const RECENT_SPEND_QUERY = `
  SELECT
    posted_at AS day,
    SUM(amount_minor) AS spend_minor
  FROM core_transaction
  WHERE direction = 'debit'
    AND posted_at >= date('now', 'localtime', '-6 days')
  GROUP BY posted_at
  ORDER BY posted_at
`

export const CATEGORY_BREAKDOWN_QUERY = `
  SELECT
    category AS name,
    SUM(amount_minor) AS value_minor
  FROM core_transaction
  WHERE direction = 'debit'
    AND posted_at >= date('now', 'localtime', 'start of month')
  GROUP BY category
  ORDER BY value_minor DESC, name ASC
`
