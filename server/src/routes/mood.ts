import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { getErrorMessage } from '../lib/errors.js'
import { moodOverviewQuerySchema } from '../schemas/mood.js'
import { createMoodService } from '../services/moodService.js'

export const registerMoodRoutes = async (app: FastifyInstance) => {
  const service = createMoodService(app.db)

  app.get('/api/mood/overview', async (request, reply) => {
    try {
      const query = moodOverviewQuerySchema.parse(request.query)
      return service.getMoodOverview(query.days ?? 7)
    } catch (error) {
      const statusCode = error instanceof ZodError ? 400 : 500
      return reply.status(statusCode).send({ error: getErrorMessage(error, 'Failed to load mood overview') })
    }
  })
}
