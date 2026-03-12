import { z } from 'zod'

export const tasksQuerySchema = z.object({
  category: z.string().min(1).optional(),
  effort: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['ready', 'active', 'waiting']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type TasksQuery = z.infer<typeof tasksQuerySchema>
