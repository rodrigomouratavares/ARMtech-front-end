import { FastifyRequest, FastifyReply } from 'fastify';
import { productService, ProductFilters } from '../services/products.service';
import { ValidationError } from '../types/error.types';
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
  validateCreateProduct,
  validateUpdateProduct,
  validateProductFilters,
  validateProductId,
  getValidationErrorMessage,
  getValidationErrorDetails
} from '../schemas/products.schemas';

/**
 * Product controller handling all product-related HTTP requests
 */
export class ProductController {
  /**
   * Get all products with optional filtering
   * GET /api/products
   */
  async getProducts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate query parameters
      const filtersValidation = validateProductFilters(request.query);

      if (!filtersValidation.success) {
        const errorMessage = getValidationErrorMessage(filtersValidation.error);
        const errorDetails = getValidationErrorDetails(filtersValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const filters = filtersValidation.data;

      const products = await productService.findAll(filters);
      const total = await productService.count(filters);

      return sendPaginated(
        reply,
        products,
        total,
        filters.page || 1,
        filters.limit || 50,
        'Products retrieved successfully'
      );
    } catch (error) {
      console.error('Error getting products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve products';
      return sendInternalError(reply, errorMessage);
    }
  }

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  async getProductById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate product ID parameter
      const paramsValidation = validateProductId(request.params);

      if (!paramsValidation.success) {
        const errorMessage = getValidationErrorMessage(paramsValidation.error);
        const errorDetails = getValidationErrorDetails(paramsValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const { id } = paramsValidation.data;

      const product = await productService.findById(id);

      if (!product) {
        return sendNotFound(reply, 'Product not found');
      }

      return sendSuccess(reply, product, 'Product retrieved successfully');
    } catch (error) {
      console.error('Error getting product by ID:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve product';
      return sendInternalError(reply, errorMessage);
    }
  }

  /**
   * Create a new product
   * POST /api/products
   */
  async createProduct(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate request body
      const bodyValidation = validateCreateProduct(request.body);

      if (!bodyValidation.success) {
        const errorMessage = getValidationErrorMessage(bodyValidation.error);
        const errorDetails = getValidationErrorDetails(bodyValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const productData = bodyValidation.data;

      const product = await productService.create(productData);

      return sendCreated(reply, product, 'Product created successfully');
    } catch (error) {
      console.error('Error creating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product';

      // Handle specific error cases
      if (errorMessage.includes('Product code already exists')) {
        return sendConflict(reply, 'A product with this code already exists');
      }

      if (errorMessage.includes('Purchase price must be a valid positive number')) {
        return sendBadRequest(reply, 'Purchase price must be a valid positive number');
      }

      if (errorMessage.includes('Sale price must be a valid positive number')) {
        return sendBadRequest(reply, 'Sale price must be a valid positive number');
      }

      if (errorMessage.includes('Sale price should not be lower than purchase price')) {
        return sendBadRequest(reply, 'Sale price should not be lower than purchase price');
      }

      return sendInternalError(reply, errorMessage);
    }
  }

  /**
   * Update an existing product
   * PUT /api/products/:id
   */
  async updateProduct(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate product ID parameter
      const paramsValidation = validateProductId(request.params);

      if (!paramsValidation.success) {
        const errorMessage = getValidationErrorMessage(paramsValidation.error);
        const errorDetails = getValidationErrorDetails(paramsValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      // Validate request body
      const bodyValidation = validateUpdateProduct(request.body);

      if (!bodyValidation.success) {
        const errorMessage = getValidationErrorMessage(bodyValidation.error);
        const errorDetails = getValidationErrorDetails(bodyValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const { id } = paramsValidation.data;
      const productData = bodyValidation.data;

      const product = await productService.update(id, productData);

      return sendSuccess(reply, product, 'Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);

      // Handle ValidationError instances
      if (error instanceof ValidationError) {
        return sendValidationError(reply, error.message, error.details);
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to update product';

      // Handle specific error cases
      if (errorMessage.includes('Product not found')) {
        return sendNotFound(reply, 'Product not found');
      }

      if (errorMessage.includes('Product code already exists')) {
        return sendConflict(reply, 'A product with this code already exists');
      }

      if (errorMessage.includes('Purchase price must be a valid positive number')) {
        return sendBadRequest(reply, 'Purchase price must be a valid positive number');
      }

      if (errorMessage.includes('Sale price must be a valid positive number')) {
        return sendBadRequest(reply, 'Sale price must be a valid positive number');
      }

      if (errorMessage.includes('Sale price should not be lower than purchase price')) {
        return sendBadRequest(reply, 'Sale price should not be lower than purchase price');
      }

      return sendInternalError(reply, errorMessage);
    }
  }

  /**
   * Delete a product
   * DELETE /api/products/:id
   */
  async deleteProduct(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate product ID parameter
      const paramsValidation = validateProductId(request.params);

      if (!paramsValidation.success) {
        const errorMessage = getValidationErrorMessage(paramsValidation.error);
        const errorDetails = getValidationErrorDetails(paramsValidation.error);
        return sendValidationError(reply, errorMessage, errorDetails);
      }

      const { id } = paramsValidation.data;

      await productService.delete(id);

      return sendNoContent(reply);
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';

      // Handle specific error cases
      if (errorMessage.includes('Product not found')) {
        return sendNotFound(reply, 'Product not found');
      }

      if (errorMessage.includes('referenced in active pre-sales')) {
        return sendConflict(reply, 'Cannot delete product that is referenced in active pre-sales');
      }

      return sendInternalError(reply, errorMessage);
    }
  }
}

// Export singleton instance
export const productController = new ProductController();