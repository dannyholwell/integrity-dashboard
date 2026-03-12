import { apiGet } from './client'

export const loadFinanceOverview = async () => apiGet('/finance/overview')

export const loadFinanceTransactions = async () => {
  const payload = await apiGet('/finance/transactions')
  return payload.items
}
