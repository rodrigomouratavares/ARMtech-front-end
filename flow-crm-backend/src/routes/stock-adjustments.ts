import { FastifyInstance } from 'fastify';
import { stockAdjustmentController } from '../controllers/stock-adjustment.controller';
import { authenticateUser } from '../middlewares/auth.middleware';
import { stockHistoryRateLimit } from '../middlewares/rate-limit.middleware';

/**
 * Stock adjustment routes using controller pattern for consistent API responses
 */
export async function stockAdjustmentRoutes(fastify: FastifyInstance): Promise<void> {

    // Get stock adjustment history with filtering and pagination
    fastify.get('/', {
        preHandler: [authenticateUser, stockHistoryRateLimit]
    }, async (request, reply) => {
        return stockAdjustmentController.getStockHistory(request, reply);
    });

    fastify.log.info('Stock adjustment routes registered with authentication and rate limiting middleware');
}