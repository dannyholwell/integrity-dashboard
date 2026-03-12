import { ZodError } from 'zod';
import { getErrorMessage } from '../lib/errors.js';
import { financeTransactionsQuerySchema } from '../schemas/finance.js';
import { createFinanceService } from '../services/financeService.js';
export const registerFinanceRoutes = async (app) => {
    const service = createFinanceService(app.db);
    app.get('/api/finance/overview', async (_request, reply) => {
        try {
            return service.getFinanceOverview();
        }
        catch (error) {
            return reply.status(500).send({ error: getErrorMessage(error, 'Failed to load finance overview') });
        }
    });
    app.get('/api/finance/transactions', async (request, reply) => {
        try {
            const query = financeTransactionsQuerySchema.parse(request.query);
            return { items: service.listTransactions(query) };
        }
        catch (error) {
            const statusCode = error instanceof ZodError ? 400 : 500;
            return reply.status(statusCode).send({ error: getErrorMessage(error, 'Failed to load transactions') });
        }
    });
};
