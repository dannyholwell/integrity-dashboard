import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { getErrorMessage } from '../lib/errors.js'
import { tasksQuerySchema } from '../schemas/tasks.js'
import { createTasksService } from '../services/tasksService.js'

export const registerTaskRoutes = async (app: FastifyInstance) => {
  const service = createTasksService(app.db)

  app.get('/api/tasks', async (request, reply) => {
    try {
      const query = tasksQuerySchema.parse(request.query)
      return { items: service.listTasks(query) }
    } catch (error) {
      const statusCode = error instanceof ZodError ? 400 : 500
      return reply.status(statusCode).send({ error: getErrorMessage(error, 'Failed to load tasks') })
    }
  })

  app.get('/api/tasks/summary', async (_request, reply) => {
    try {
      return service.getTaskSummary()
    } catch (error) {
      return reply.status(500).send({ error: getErrorMessage(error, 'Failed to load task summary') })
    }
  })
}
