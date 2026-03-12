import { apiGet } from './client'

export const loadMoodOverview = async () => apiGet('/mood/overview')
