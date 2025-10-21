import { FastifyInstance } from 'fastify';
import { customerController } from '../controllers/customers.controller';

/**
 * Customer routes
 */
export async function customerRoutes(fastify: FastifyInstance): Promise<void> {
  // Authentication middleware
  const authenticate = async (request: any, reply: any) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reply.status(401).send({ message: 'No token provided' });
    }
    // For now, just check if token exists - in real implementation would validate JWT
  };

  // Get all customers with filtering
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    return customerController.getCustomers(request, reply);
  });

  // Get customer by ID
  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    return customerController.getCustomerById(request, reply);
  });

  // Create customer
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    return customerController.createCustomer(request, reply);
  });

  // Update customer
  fastify.put('/:id', { preHandler: authenticate }, async (request, reply) => {
    return customerController.updateCustomer(request, reply);
  });

  // Delete customer
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    return customerController.deleteCustomer(request, reply);
  });

  fastify.log.info('Customer routes registered');
}