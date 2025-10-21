import { FastifyRequest, FastifyReply } from 'fastify';
import { customerService, CustomerFilters } from '../services/customers.service';
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
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCustomerFilters,
  validateCustomerId,
  getValidationErrorMessage,
  getValidationErrorDetails
} from '../schemas/customers.schemas';

/**
 * Customer controller handling all customer-related HTTP requests
 */
export class CustomerController {
  /**
   * Get all customers with optional filtering
   * GET /api/customers
   */
  async getCustomers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      console.log('Raw query params:', request.query);

      // Validate query parameters
      const filtersValidation = validateCustomerFilters(request.query);

      if (!filtersValidation.success) {
        console.log('Validation failed:', filtersValidation.error);
        const errorMessage = getValidationErrorMessage(filtersValidation.error);
        const errorDetails = getValidationErrorDetails(filtersValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const filters = filtersValidation.data;
      console.log('Validated filters:', filters);

      const customers = await customerService.findAll(filters);
      const total = await customerService.count(filters);

      console.log('Found customers:', customers.length, 'Total:', total);
      console.log('First customer names:', customers.slice(0, 3).map(c => c.name));

      return sendPaginated(
        reply,
        customers,
        total,
        filters.page,
        filters.limit,
        'Customers retrieved successfully'
      );
    } catch (error) {
      console.error('Error getting customers:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve customers';
      return sendInternalError(reply, errorMessage);
    }
  }

  /**
   * Get customer by ID
   * GET /api/customers/:id
   */
  async getCustomerById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate customer ID parameter
      const paramsValidation = validateCustomerId(request.params);

      if (!paramsValidation.success) {
        const errorMessage = getValidationErrorMessage(paramsValidation.error);
        const errorDetails = getValidationErrorDetails(paramsValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const { id } = paramsValidation.data;

      const customer = await customerService.findById(id);

      if (!customer) {
        return sendNotFound(reply, 'Customer not found');
      }

      return sendSuccess(reply, customer, 'Customer retrieved successfully');
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve customer';
      return sendInternalError(reply, errorMessage);
    }
  }

  /**
   * Create a new customer
   * POST /api/customers
   */
  async createCustomer(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate request body
      const bodyValidation = validateCreateCustomer(request.body);

      if (!bodyValidation.success) {
        const errorMessage = getValidationErrorMessage(bodyValidation.error);
        const errorDetails = getValidationErrorDetails(bodyValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const customerData = bodyValidation.data;

      const customer = await customerService.create(customerData);

      return sendCreated(reply, customer, 'Customer created successfully');
    } catch (error) {
      console.error('Error creating customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';

      // Handle specific error cases
      if (errorMessage.includes('CPF already exists')) {
        return sendConflict(reply, 'A customer with this CPF already exists');
      }

      if (errorMessage.includes('Email already exists')) {
        return sendConflict(reply, 'A customer with this email already exists');
      }

      if (errorMessage.includes('Invalid CPF format')) {
        return sendBadRequest(reply, 'Invalid CPF format');
      }

      return sendInternalError(reply, errorMessage);
    }
  }

  /**
   * Update an existing customer
   * PUT /api/customers/:id
   */
  async updateCustomer(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate customer ID parameter
      const paramsValidation = validateCustomerId(request.params);

      if (!paramsValidation.success) {
        const errorMessage = getValidationErrorMessage(paramsValidation.error);
        const errorDetails = getValidationErrorDetails(paramsValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      // Validate request body
      const bodyValidation = validateUpdateCustomer(request.body);

      if (!bodyValidation.success) {
        const errorMessage = getValidationErrorMessage(bodyValidation.error);
        const errorDetails = getValidationErrorDetails(bodyValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const { id } = paramsValidation.data;
      const customerData = bodyValidation.data;

      const customer = await customerService.update(id, customerData);

      return sendSuccess(reply, customer, 'Customer updated successfully');
    } catch (error) {
      console.error('Error updating customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update customer';

      // Handle specific error cases
      if (errorMessage.includes('Customer not found')) {
        return sendNotFound(reply, 'Customer not found');
      }

      if (errorMessage.includes('CPF already exists')) {
        return sendConflict(reply, 'A customer with this CPF already exists');
      }

      if (errorMessage.includes('Email already exists')) {
        return sendConflict(reply, 'A customer with this email already exists');
      }

      if (errorMessage.includes('Invalid CPF format')) {
        return sendBadRequest(reply, 'Invalid CPF format');
      }

      return sendInternalError(reply, errorMessage);
    }
  }

  /**
   * Delete a customer
   * DELETE /api/customers/:id
   */
  async deleteCustomer(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate customer ID parameter
      const paramsValidation = validateCustomerId(request.params);

      if (!paramsValidation.success) {
        const errorMessage = getValidationErrorMessage(paramsValidation.error);
        const errorDetails = getValidationErrorDetails(paramsValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const { id } = paramsValidation.data;

      await customerService.delete(id);

      return sendNoContent(reply);
    } catch (error) {
      console.error('Error deleting customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete customer';

      // Handle specific error cases
      if (errorMessage.includes('Customer not found')) {
        return sendNotFound(reply, 'Customer not found');
      }

      if (errorMessage.includes('active pre-sales')) {
        return sendConflict(reply, 'Cannot delete customer with active pre-sales');
      }

      return sendInternalError(reply, errorMessage);
    }
  }
}

// Export singleton instance
export const customerController = new CustomerController();