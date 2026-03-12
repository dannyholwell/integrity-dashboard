import { apiGet } from './client'

export const loadHealthOverview = async () => apiGet('/health/overview')
