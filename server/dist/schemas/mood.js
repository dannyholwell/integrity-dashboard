import { z } from 'zod';
export const moodOverviewQuerySchema = z.object({
    days: z.coerce.number().int().positive().max(90).optional(),
});
