import Fastify from 'fastify'
import type { AppDatabase } from './db/connection.js'
import { registerDataManagementRoutes } from './routes/dataManagement.js'
import { registerDashboardRoutes } from './routes/dashboard.js'
import { registerFinanceRoutes } from './routes/finance.js'
import { registerHealthRoutes } from './routes/health.js'
import { registerMoodRoutes } from './routes/mood.js'
import { registerTaskRoutes } from './routes/tasks.js'

declare module 'fastify' {
  interface FastifyInstance {
    db: AppDatabase
    uploadsRoot: string
  }
}

export const buildApp = (db: AppDatabase, logLevel: string, uploadsRoot: string) => {
  const app = Fastify({
    logger: {
      level: logLevel,
      transport:
        process.env.NODE_ENV === 'production'
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                colorize: true,
              },
            },
    },
  })

  app.decorate('db', db)
  app.decorate('uploadsRoot', uploadsRoot)

  app.get('/api/healthcheck', async () => ({
    status: 'ok',
  }))

  app.register(registerDataManagementRoutes)
  app.register(registerDashboardRoutes)
  app.register(registerTaskRoutes)
  app.register(registerFinanceRoutes)
  app.register(registerHealthRoutes)
  app.register(registerMoodRoutes)

  return app
}
