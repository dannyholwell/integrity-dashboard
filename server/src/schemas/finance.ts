import { z } from 'zod'

export const financeTransactionsQuerySchema = z.object({
  category: z.string().min(1).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  limit: z.coerce.number().int().positive().max(5000).optional(),
})

export const financeTransactionParamsSchema = z.object({
  id: z.string().min(1),
})

export const financeTransactionUpdateSchema = z
  .object({
    merchant: z.string().trim().max(255).nullable().optional(),
    category: z.string().trim().min(1).max(255).optional(),
  })
  .refine((value) => value.merchant !== undefined || value.category !== undefined, {
    message: 'Provide merchant or category to update',
  })

export type FinanceTransactionsQuery = z.infer<typeof financeTransactionsQuerySchema>
export type FinanceTransactionUpdate = z.infer<typeof financeTransactionUpdateSchema>
