import { FastifyInstance } from 'fastify';
import { paymentMethodsController } from '../controllers/payment-methods.controller';
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  paymentMethodIdSchema,
  paymentMethodQuerySchema
} from '../schemas/payment-methods.schemas';

/**
 * Payment Methods routes
 * Handles all routes for payment methods CRUD operations
 */
export async function paymentMethodsRoutes(fastify: FastifyInstance): Promise<void> {
  // Authentication middleware (simple version)
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

  /**
   * GET /api/payment-methods
   * List all payment methods with pagination and filters
   */
  fastify.get('/', { 
    preHandler: authenticate
  }, async (request, reply) => {
    return paymentMethodsController.getPaymentMethods(request as any, reply);
  });

  /**
   * GET /api/payment-methods/:id
   * Get a specific payment method by ID
   */
  fastify.get('/:id', {
    preHandler: authenticate
  }, async (request, reply) => {
    return paymentMethodsController.getPaymentMethodById(request as any, reply);
  });

  /**
   * POST /api/payment-methods
   * Create a new payment method
   */
  fastify.post('/', {
    preHandler: authenticate
  }, async (request, reply) => {
    return paymentMethodsController.createPaymentMethod(request as any, reply);
  });

  /**
   * PUT /api/payment-methods/:id
   * Update an existing payment method
   */
  fastify.put('/:id', {
    preHandler: authenticate
  }, async (request, reply) => {
    return paymentMethodsController.updatePaymentMethod(request as any, reply);
  });

  /**
   * DELETE /api/payment-methods/:id
   * Soft delete a payment method (sets isActive to false)
   */
  fastify.delete('/:id', {
    preHandler: authenticate
  }, async (request, reply) => {
    return paymentMethodsController.deletePaymentMethod(request as any, reply);
  });

  fastify.log.info('Payment methods routes registered successfully');
}
