import { z } from 'zod'

export const healthOverviewQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(90).optional(),
})

export type HealthOverviewQuery = z.infer<typeof healthOverviewQuerySchema>
