import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { getErrorMessage } from '../lib/errors.js'
import { dataUploadDeleteParamsSchema, dataUploadSchema } from '../schemas/dataManagement.js'
import { createDataManagementService } from '../services/dataManagementService.js'

export const registerDataManagementRoutes = async (app: FastifyInstance) => {
  const service = createDataManagementService({
    db: app.db,
    uploadsRoot: app.uploadsRoot,
    runImport: app.runImport,
  })

  app.get('/api/data-management/files', async (_request, reply) => {
    try {
      return { items: service.listFiles() }
    } catch (error) {
      return reply.status(500).send({ error: getErrorMessage(error, 'Failed to load uploaded files') })
    }
  })

  app.post('/api/data-management/files', { bodyLimit: 10 * 1024 * 1024 }, async (request, reply) => {
    try {
      const payload = dataUploadSchema.parse(request.body)
      const result = await service.saveFile(payload)
      return reply.status(201).send(result)
    } catch (error) {
      const statusCode = error instanceof ZodError ? 400 : 500
      return reply.status(statusCode).send({ error: getErrorMessage(error, 'Failed to upload CSV file') })
    }
  })

  app.delete('/api/data-management/files/:id', async (request, reply) => {
    try {
      const { id } = dataUploadDeleteParamsSchema.parse(request.params)
      const item = await service.deleteFile(id)
      return { item }
    } catch (error) {
      const isNotFound = error instanceof Error && error.message === 'Upload not found'
      const statusCode = isNotFound ? 404 : error instanceof ZodError ? 400 : 500
      return reply.status(statusCode).send({ error: getErrorMessage(error, 'Failed to delete uploaded file') })
    }
  })
}
