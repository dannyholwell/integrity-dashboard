import { apiGet } from './client'

export const loadDashboardSummary = async () => apiGet('/dashboard/summary')
