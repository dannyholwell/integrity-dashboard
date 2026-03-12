import { apiGet } from './client'

export const loadFinanceOverview = async () => apiGet('/finance/overview')

export const loadFinanceTransactions = async (query = {}) => {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  const payload = await apiGet(`/finance/transactions${suffix}`)
  return payload.items
}
