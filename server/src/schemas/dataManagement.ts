import { z } from 'zod'

export const dataUploadDomainSchema = z.enum(['tasks', 'finance', 'health', 'mood'])

export const dataUploadSchema = z.object({
  domain: dataUploadDomainSchema,
  fileName: z.string().trim().min(1),
  content: z.string().min(1),
  dateRangeStart: z.string().date().nullable().optional(),
  dateRangeEnd: z.string().date().nullable().optional(),
})

export const dataUploadDeleteParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type DataUploadInput = z.infer<typeof dataUploadSchema>
