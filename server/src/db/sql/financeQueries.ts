const SPEND_FILTER_SQL = `
  direction = 'debit'
  AND COALESCE(category, '') <> 'Internal transfers'
`

export const RECENT_SPEND_QUERY = `
  SELECT
    posted_at AS day,
    SUM(amount_minor) AS spend_minor
  FROM core_transaction
  WHERE ${SPEND_FILTER_SQL}
    AND posted_at >= date('now', 'localtime', '-6 days')
  GROUP BY posted_at
  ORDER BY posted_at
`

export const CATEGORY_BREAKDOWN_QUERY = `
  SELECT
    category AS name,
    SUM(amount_minor) AS value_minor
  FROM core_transaction
  WHERE ${SPEND_FILTER_SQL}
    AND posted_at >= date('now', 'localtime', '-6 days')
  GROUP BY category
  ORDER BY value_minor DESC, name ASC
`
