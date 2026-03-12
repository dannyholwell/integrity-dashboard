import type { AppDatabase } from '../db/connection.js'
import { TASK_SUMMARY_QUERY } from '../db/sql/tasksQueries.js'
import type { TasksQuery } from '../schemas/tasks.js'

type TaskRow = {
  id: string
  title: string
  summary: string | null
  category: string
  effort: 'low' | 'medium' | 'high'
  status: 'ready' | 'active' | 'waiting'
  due_date: string | null
  source_system: string
  source_record_id: string
  source_path: string | null
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

const formatDueLabel = (dueDate: string | null) => {
  if (!dueDate) {
    return 'No due date'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(`${dueDate}T00:00:00`)
  const diffDays = Math.round((due.getTime() - today.getTime()) / DAY_IN_MS)

  if (diffDays <= 0) {
    return 'Today'
  }

  if (diffDays === 1) {
    return 'Tomorrow'
  }

  if (diffDays <= 6) {
    return 'This week'
  }

  return 'Later'
}

export const createTasksService = (db: AppDatabase) => {
  const listTasks = (query: TasksQuery = {}) => {
    const filters: string[] = ['is_archived = 0']
    const params: Array<string | number> = []

    if (query.category) {
      filters.push('category = ?')
      params.push(query.category)
    }

    if (query.effort) {
      filters.push('effort = ?')
      params.push(query.effort)
    }

    if (query.status) {
      filters.push('status = ?')
      params.push(query.status)
    }

    const limit = query.limit ?? 100
    params.push(limit)

    const sql = `
      SELECT
        id,
        title,
        summary,
        category,
        effort,
        status,
        due_date,
        source_system,
        source_record_id,
        source_path
      FROM core_task
      WHERE ${filters.join(' AND ')}
      ORDER BY
        CASE status WHEN 'ready' THEN 1 WHEN 'active' THEN 2 ELSE 3 END,
        due_date IS NULL,
        due_date ASC,
        title ASC
      LIMIT ?
    `

    const rows = db.prepare(sql).all(...params) as TaskRow[]

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary ?? '',
      category: row.category,
      effort: row.effort,
      status: row.status,
      dueLabel: formatDueLabel(row.due_date),
      sourceId: `${row.source_system}:${row.source_record_id}`,
      sourcePath: row.source_path ?? 'Local import',
    }))
  }

  const getTaskSummary = () => {
    const row = db.prepare(TASK_SUMMARY_QUERY).get() as {
      total: number
      ready_count: number
      active_count: number
      waiting_count: number
      low_effort_count: number
      medium_effort_count: number
      high_effort_count: number
    }

    return {
      total: row.total ?? 0,
      byStatus: {
        ready: row.ready_count ?? 0,
        active: row.active_count ?? 0,
        waiting: row.waiting_count ?? 0,
      },
      byEffort: {
        low: row.low_effort_count ?? 0,
        medium: row.medium_effort_count ?? 0,
        high: row.high_effort_count ?? 0,
      },
    }
  }

  return {
    listTasks,
    getTaskSummary,
  }
}
