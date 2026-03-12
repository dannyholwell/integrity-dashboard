export const TASK_SUMMARY_QUERY = `
  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) AS ready_count,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) AS waiting_count,
    SUM(CASE WHEN effort = 'low' THEN 1 ELSE 0 END) AS low_effort_count,
    SUM(CASE WHEN effort = 'medium' THEN 1 ELSE 0 END) AS medium_effort_count,
    SUM(CASE WHEN effort = 'high' THEN 1 ELSE 0 END) AS high_effort_count
  FROM core_task
  WHERE is_archived = 0
`
