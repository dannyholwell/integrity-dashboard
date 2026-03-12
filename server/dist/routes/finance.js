import { ZodError } from 'zod';
import { getErrorMessage } from '../lib/errors.js';
import { financeTransactionParamsSchema, financeTransactionsQuerySchema, financeTransactionUpdateSchema } from '../schemas/finance.js';
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
    app.patch('/api/finance/transactions/:id', async (request, reply) => {
        try {
            const { id } = financeTransactionParamsSchema.parse(request.params);
            const body = financeTransactionUpdateSchema.parse(request.body);
            return { item: service.updateTransaction(id, body) };
        }
        catch (error) {
            const isNotFound = error instanceof Error && error.message === 'Transaction not found';
            const statusCode = isNotFound ? 404 : error instanceof ZodError ? 400 : 500;
            return reply.status(statusCode).send({ error: getErrorMessage(error, 'Failed to update transaction') });
        }
    });
};
