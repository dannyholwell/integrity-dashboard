import { loadTasks as loadTasksFromApi } from '../api/tasksApi'

export const loadTasks = async () => loadTasksFromApi()
