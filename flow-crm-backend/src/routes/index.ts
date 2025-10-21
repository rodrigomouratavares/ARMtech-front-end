import { FastifyPluginAsync } from 'fastify';
import { authRoutes } from './auth';
import { customerRoutes } from './customers';
import { productRoutes } from './products';
import { preSalesRoutes } from './presales';
import { priceRoutes } from './price';
import { monitoringRoutes } from './monitoring';
import { paymentMethodsRoutes } from './payment-methods';
import { auditLogsRoutes } from './audit-logs';
import { userRoutes } from './users';
import { stockAdjustmentRoutes } from './stock-adjustments';
import { reportsRoutes } from './reports.routes';
import { debugRoutes } from './debug.routes';

export const registerRoutes: FastifyPluginAsync = async (fastify) => {
  // Register API routes here
  fastify.get('/api/test', async () => {
    return { message: 'API is working!' };
  });

  // Register auth routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });

  // Register customer routes
  await fastify.register(customerRoutes, { prefix: '/api/customers' });

  // Register product routes
  await fastify.register(productRoutes, { prefix: '/api/products' });

  // Register presales routes
  await fastify.register(preSalesRoutes, { prefix: '/api/presales' });

  // Register price calculation routes
  await fastify.register(priceRoutes, { prefix: '/api/price' });

  // Register monitoring routes
  await fastify.register(monitoringRoutes, { prefix: '/api/monitoring' });

  // Register payment methods routes
  await fastify.register(paymentMethodsRoutes, { prefix: '/api/payment-methods' });

  // Register audit logs routes
  await fastify.register(auditLogsRoutes, { prefix: '/api/audit-logs' });

  // Register user management routes
  await fastify.register(userRoutes, { prefix: '/api/users' });

  // Register stock adjustment routes
  await fastify.register(stockAdjustmentRoutes, { prefix: '/api/stock-adjustments' });

  // Register reports routes
  await fastify.register(reportsRoutes, { prefix: '/api/reports' });

  // Register debug routes (development only)
  await fastify.register(debugRoutes, { prefix: '/api/debug' });

  fastify.log.info('All routes registered successfully');
};
