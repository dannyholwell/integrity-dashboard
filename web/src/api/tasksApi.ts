import { apiGet } from './client'

export const loadTasks = async () => {
  const payload = await apiGet('/tasks')
  return payload.items
}

export const loadTaskSummary = async () => apiGet('/tasks/summary')
