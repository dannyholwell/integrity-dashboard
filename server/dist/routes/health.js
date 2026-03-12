import { ZodError } from 'zod';
import { getErrorMessage } from '../lib/errors.js';
import { healthOverviewQuerySchema } from '../schemas/health.js';
import { createHealthService } from '../services/healthService.js';
export const registerHealthRoutes = async (app) => {
    const service = createHealthService(app.db);
    app.get('/api/health/overview', async (request, reply) => {
        try {
            const query = healthOverviewQuerySchema.parse(request.query);
            return service.getHealthOverview(query.days ?? 7);
        }
        catch (error) {
            const statusCode = error instanceof ZodError ? 400 : 500;
            return reply.status(statusCode).send({ error: getErrorMessage(error, 'Failed to load health overview') });
        }
    });
};
