import { FastifyRequest, FastifyReply } from 'fastify';
import { paymentMethodService } from '../services/payment-methods.service';
import {
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
  PaymentMethodIdParams,
  PaymentMethodQueryParams
} from '../schemas/payment-methods.schemas';
import { AuditHelper } from '../utils/audit-helper';

/**
 * Payment Methods Controller
 * Handles all HTTP requests related to payment methods
 */
export class PaymentMethodsController {
  /**
   * Get all payment methods with pagination and filters
   * GET /api/payment-methods
   */
  async getPaymentMethods(
    request: FastifyRequest<{ Querystring: PaymentMethodQueryParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const filters = request.query;

      // Get payment methods
      const paymentMethodsList = await paymentMethodService.findAll(filters);

      // Get total count for pagination
      const total = await paymentMethodService.count(filters);

      // Calculate pagination metadata
      const { page = 1, limit = 50 } = filters;
      const totalPages = Math.ceil(total / limit);

      // Log view action
      const user = (request as any).user;
      if (user) {
        await AuditHelper.logView(
          'payment_methods',
          user.id,
          user.name || user.email || 'Unknown',
          request,
          undefined,
          `Viewed list with filters: ${JSON.stringify(filters)}`
        );
      }

      reply.status(200).send({
        success: true,
        data: paymentMethodsList,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        message: 'Payment methods retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve payment methods';

      reply.status(500).send({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: errorMessage
        },
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  }

  /**
   * Get payment method by ID
   * GET /api/payment-methods/:id
   */
  async getPaymentMethodById(
    request: FastifyRequest<{ Params: PaymentMethodIdParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;

      const paymentMethod = await paymentMethodService.findById(id);

      if (!paymentMethod) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payment method not found'
          },
          timestamp: new Date().toISOString(),
          path: request.url
        });
      }

      // Log view action
      const user = (request as any).user;
      if (user) {
        await AuditHelper.logView(
          'payment_methods',
          user.id,
          user.name || user.email || 'Unknown',
          request,
          id,
          `Viewed payment method: ${paymentMethod.description}`
        );
      }

      reply.status(200).send({
        success: true,
        data: paymentMethod,
        message: 'Payment method retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve payment method';

      reply.status(500).send({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: errorMessage
        },
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  }

  /**
   * Create a new payment method
   * POST /api/payment-methods
   */
  async createPaymentMethod(
    request: FastifyRequest<{ Body: CreatePaymentMethodRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const data = request.body;

      // Get user ID from authenticated user (if available)
      const userId = (request as any).user?.id;

      // Create payment method
      const paymentMethod = await paymentMethodService.create({
        ...data,
        createdBy: userId
      });

      // Log create action
      const user = (request as any).user;
      if (user) {
        await AuditHelper.logCreate(
          'payment_methods',
          paymentMethod.id,
          user.id,
          user.name || user.email || 'Unknown',
          request,
          `Created payment method: ${paymentMethod.description} (${paymentMethod.code})`
        );
      }

      reply.status(201).send({
        success: true,
        data: paymentMethod,
        message: 'Payment method created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment method';

      // Handle specific errors
      if (errorMessage.includes('already exists')) {
        return reply.status(409).send({
          success: false,
          error: {
            code: 'ALREADY_EXISTS',
            message: errorMessage
          },
          timestamp: new Date().toISOString(),
          path: request.url
        });
      }

      reply.status(400).send({
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: errorMessage
        },
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  }

  /**
   * Update a payment method
   * PUT /api/payment-methods/:id
   */
  async updatePaymentMethod(
    request: FastifyRequest<{
      Params: PaymentMethodIdParams;
      Body: UpdatePaymentMethodRequest;
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      const data = request.body;

      const paymentMethod = await paymentMethodService.update(id, data);

      if (!paymentMethod) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payment method not found'
          },
          timestamp: new Date().toISOString(),
          path: request.url
        });
      }

      // Log update action
      const user = (request as any).user;
      if (user) {
        await AuditHelper.logUpdate(
          'payment_methods',
          id,
          user.id,
          user.name || user.email || 'Unknown',
          request,
          `Updated payment method: ${paymentMethod.description} - Changes: ${JSON.stringify(data)}`
        );
      }

      reply.status(200).send({
        success: true,
        data: paymentMethod,
        message: 'Payment method updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment method';

      reply.status(400).send({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: errorMessage
        },
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  }

  /**
   * Delete a payment method (soft delete)
   * DELETE /api/payment-methods/:id
   */
  async deletePaymentMethod(
    request: FastifyRequest<{ Params: PaymentMethodIdParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;

      const deleted = await paymentMethodService.delete(id);

      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payment method not found'
          },
          timestamp: new Date().toISOString(),
          path: request.url
        });
      }

      // Log delete action
      const user = (request as any).user;
      if (user) {
        await AuditHelper.logDelete(
          'payment_methods',
          id,
          user.id,
          user.name || user.email || 'Unknown',
          request,
          'Deleted payment method'
        );
      }

      reply.status(200).send({
        success: true,
        message: 'Payment method deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete payment method';

      // Handle conflict (payment method in use)
      if (errorMessage.includes('being used')) {
        return reply.status(409).send({
          success: false,
          error: {
            code: 'CONFLICT',
            message: errorMessage
          },
          timestamp: new Date().toISOString(),
          path: request.url
        });
      }

      reply.status(500).send({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: errorMessage
        },
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  }
}

// Export singleton instance
export const paymentMethodsController = new PaymentMethodsController();
