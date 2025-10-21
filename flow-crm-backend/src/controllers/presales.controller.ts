import { FastifyRequest, FastifyReply } from 'fastify';
import { preSalesService, PreSalesFilters } from '../services/presales.service';
import { PreSaleStatus } from '../types/common.types';
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendBadRequest,
  sendNotFound,
  sendConflict,
  sendInternalError,
  sendPaginated,
  sendValidationError
} from '../utils/response-helpers';
import {
  validateCreatePreSale,
  validateUpdatePreSale,
  validateUpdatePreSaleStatus,
  validatePreSaleFilters,
  validatePreSaleId,
  getValidationErrorMessage,
  getValidationErrorDetails,
  validatePreSaleBusinessRules
} from '../schemas/presales.schemas';

/**
 * PreSales controller handling all pre-sales-related HTTP requests
 */
export class PreSalesController {
  /**
   * Get all pre-sales with optional filtering
   * GET /api/presales
   */
  async getPreSales(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate query parameters
      const filtersValidation = validatePreSaleFilters(request.query);
      
      if (!filtersValidation.success) {
        const errorMessage = getValidationErrorMessage(filtersValidation.error);
        const errorDetails = getValidationErrorDetails(filtersValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const filters = filtersValidation.data;

      const preSales = await preSalesService.findAll(filters);
      const total = await preSalesService.count(filters);

      return sendPaginated(
        reply,
        preSales,
        total,
        filters.page,
        filters.limit,
        'Pre-sales retrieved successfully'
      );
    } catch (error) {
      console.error('Error getting pre-sales:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve pre-sales';
      return sendInternalError(reply, errorMessage);
    }
  }

  /**
   * Get pre-sale by ID with items
   * GET /api/presales/:id
   */
  async getPreSaleById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate pre-sale ID parameter
      const paramsValidation = validatePreSaleId(request.params);
      
      if (!paramsValidation.success) {
        const errorMessage = getValidationErrorMessage(paramsValidation.error);
        const errorDetails = getValidationErrorDetails(paramsValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const { id } = paramsValidation.data;

      const preSale = await preSalesService.findById(id);

      if (!preSale) {
        return sendNotFound(reply, 'Pre-sale not found');
      }

      return sendSuccess(reply, preSale, 'Pre-sale retrieved successfully');
    } catch (error) {
      console.error('Error getting pre-sale by ID:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve pre-sale';
      return sendInternalError(reply, errorMessage);
    }
  }

  /**
   * Create a new pre-sale with items
   * POST /api/presales
   * 
   * Supports discount types:
   * - fixed: discount as monetary value (R$)
   * - percentage: discount as percentage (0-100%)
   * 
   * The system automatically converts between types:
   * - If percentage is provided, fixed value is calculated
   * - If fixed value is provided, percentage is calculated
   */
  async createPreSale(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate request body (includes discountType and discountPercentage)
      const bodyValidation = validateCreatePreSale(request.body);
      
      if (!bodyValidation.success) {
        const errorMessage = getValidationErrorMessage(bodyValidation.error);
        const errorDetails = getValidationErrorDetails(bodyValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const preSaleData = bodyValidation.data;

      // Validate business rules
      const businessRuleErrors = validatePreSaleBusinessRules(preSaleData);
      if (businessRuleErrors.length > 0) {
        return sendBadRequest(reply, businessRuleErrors.join('; '));
      }

      // Service handles automatic discount conversion
      const preSale = await preSalesService.create(preSaleData);

      return sendCreated(reply, preSale, 'Pre-sale created successfully');
    } catch (error) {
      console.error('Error creating pre-sale:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create pre-sale';

      // Handle specific error cases
      if (errorMessage.includes('Customer not found')) {
        return sendNotFound(reply, 'Customer not found');
      }

      if (errorMessage.includes('Product not found')) {
        return sendNotFound(reply, errorMessage);
      }

      if (errorMessage.includes('Insufficient stock')) {
        return sendConflict(reply, errorMessage);
      }

      return sendInternalError(reply, errorMessage);
    }
  }

  /**
   * Update an existing pre-sale
   * PUT /api/presales/:id
   * 
   * Supports updating discount type and values:
   * - Can change between fixed and percentage discount types
   * - Automatic conversion maintains discount equivalence
   * - Both discount fields are recalculated and saved
   */
  async updatePreSale(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate pre-sale ID parameter
      const paramsValidation = validatePreSaleId(request.params);
      
      if (!paramsValidation.success) {
        const errorMessage = getValidationErrorMessage(paramsValidation.error);
        const errorDetails = getValidationErrorDetails(paramsValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      // Validate request body (includes discountType and discountPercentage)
      const bodyValidation = validateUpdatePreSale(request.body);
      
      if (!bodyValidation.success) {
        const errorMessage = getValidationErrorMessage(bodyValidation.error);
        const errorDetails = getValidationErrorDetails(bodyValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const { id } = paramsValidation.data;
      const preSaleData = bodyValidation.data;

      // Validate business rules
      const businessRuleErrors = validatePreSaleBusinessRules(preSaleData);
      if (businessRuleErrors.length > 0) {
        return sendBadRequest(reply, businessRuleErrors.join('; '));
      }

      // Service handles automatic discount conversion
      const preSale = await preSalesService.update(id, preSaleData);

      return sendSuccess(reply, preSale, 'Pre-sale updated successfully');
    } catch (error) {
      console.error('Error updating pre-sale:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update pre-sale';

      // Handle specific error cases
      if (errorMessage.includes('Pre-sale not found')) {
        return sendNotFound(reply, 'Pre-sale not found');
      }

      if (errorMessage.includes('Customer not found')) {
        return sendNotFound(reply, 'Customer not found');
      }

      if (errorMessage.includes('Product not found')) {
        return sendNotFound(reply, errorMessage);
      }

      if (errorMessage.includes('Insufficient stock')) {
        return sendConflict(reply, errorMessage);
      }

      if (errorMessage.includes('Invalid status transition')) {
        return sendBadRequest(reply, errorMessage);
      }

      return sendInternalError(reply, errorMessage);
    }
  }

  /**
   * Delete a pre-sale and all its items
   * DELETE /api/presales/:id
   */
  async deletePreSale(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate pre-sale ID parameter
      const paramsValidation = validatePreSaleId(request.params);
      
      if (!paramsValidation.success) {
        const errorMessage = getValidationErrorMessage(paramsValidation.error);
        const errorDetails = getValidationErrorDetails(paramsValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const { id } = paramsValidation.data;

      await preSalesService.delete(id);

      return sendNoContent(reply);
    } catch (error) {
      console.error('Error deleting pre-sale:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete pre-sale';

      // Handle specific error cases
      if (errorMessage.includes('Pre-sale not found')) {
        return sendNotFound(reply, 'Pre-sale not found');
      }

      return sendInternalError(reply, errorMessage);
    }
  }

  /**
   * Update pre-sale status
   * PUT /api/presales/:id/status
   */
  async updatePreSaleStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate pre-sale ID parameter
      const paramsValidation = validatePreSaleId(request.params);
      
      if (!paramsValidation.success) {
        const errorMessage = getValidationErrorMessage(paramsValidation.error);
        const errorDetails = getValidationErrorDetails(paramsValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      // Validate request body
      const bodyValidation = validateUpdatePreSaleStatus(request.body);
      
      if (!bodyValidation.success) {
        const errorMessage = getValidationErrorMessage(bodyValidation.error);
        const errorDetails = getValidationErrorDetails(bodyValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const { id } = paramsValidation.data;
      const { status } = bodyValidation.data;

      const preSale = await preSalesService.updateStatus(id, status);

      return sendSuccess(reply, preSale, 'Pre-sale status updated successfully');
    } catch (error) {
      console.error('Error updating pre-sale status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update pre-sale status';

      // Handle specific error cases
      if (errorMessage.includes('Pre-sale not found')) {
        return sendNotFound(reply, 'Pre-sale not found');
      }

      if (errorMessage.includes('Invalid status transition')) {
        return sendBadRequest(reply, errorMessage);
      }

      return sendInternalError(reply, errorMessage);
    }
  }
}

// Export singleton instance
export const preSalesController = new PreSalesController();