import { getErrorMessage } from '../lib/errors.js';
import { createDashboardService } from '../services/dashboardService.js';
export const registerDashboardRoutes = async (app) => {
    const service = createDashboardService(app.db);
    app.get('/api/dashboard/summary', async (_request, reply) => {
        try {
            return service.getSummary();
        }
        catch (error) {
            return reply.status(500).send({ error: getErrorMessage(error, 'Failed to load dashboard summary') });
        }
    });
};
