import { FastifyInstance } from 'fastify';
import { preSalesController } from '../controllers/presales.controller';

/**
 * PreSales routes
 */
export async function preSalesRoutes(fastify: FastifyInstance): Promise<void> {
  // Authentication middleware
  const authenticate = async (request: any, reply: any) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided'
        },
        timestamp: new Date().toISOString()
      });
    }
    // For now, just check if token exists - in real implementation would validate JWT
  };

  // Get all pre-sales with filtering
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    return preSalesController.getPreSales(request, reply);
  });

  // Get presale by ID
  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    return preSalesController.getPreSaleById(request, reply);
  });

  // Create presale
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    return preSalesController.createPreSale(request, reply);
  });

  // Update presale
  fastify.put('/:id', { preHandler: authenticate }, async (request, reply) => {
    return preSalesController.updatePreSale(request, reply);
  });

  // Update presale status
  fastify.patch('/:id/status', { preHandler: authenticate }, async (request, reply) => {
    return preSalesController.updatePreSaleStatus(request, reply);
  });

  // Delete presale
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    return preSalesController.deletePreSale(request, reply);
  });

  fastify.log.info('Presales routes registered with standardized response format');
}