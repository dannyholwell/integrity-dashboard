import Fastify from 'fastify';
import { registerDataManagementRoutes } from './routes/dataManagement.js';
import { registerDashboardRoutes } from './routes/dashboard.js';
import { registerFinanceRoutes } from './routes/finance.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerMoodRoutes } from './routes/mood.js';
import { registerTaskRoutes } from './routes/tasks.js';
export const buildApp = (db, logLevel, uploadsRoot, runImport) => {
    const app = Fastify({
        logger: {
            level: logLevel,
            transport: process.env.NODE_ENV === 'production'
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                    },
                },
        },
    });
    app.decorate('db', db);
    app.decorate('uploadsRoot', uploadsRoot);
    app.decorate('runImport', runImport);
    app.get('/api/healthcheck', async () => ({
        status: 'ok',
    }));
    app.register(registerDataManagementRoutes);
    app.register(registerDashboardRoutes);
    app.register(registerTaskRoutes);
    app.register(registerFinanceRoutes);
    app.register(registerHealthRoutes);
    app.register(registerMoodRoutes);
    return app;
};
