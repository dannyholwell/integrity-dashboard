import { z } from 'zod'

export const financeTransactionsQuerySchema = z.object({
  category: z.string().min(1).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type FinanceTransactionsQuery = z.infer<typeof financeTransactionsQuerySchema>
