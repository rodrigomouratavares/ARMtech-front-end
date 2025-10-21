import { FastifyRequest, FastifyReply } from 'fastify';
import { stockAdjustmentService, StockHistoryFilters } from '../services/stock-adjustment.service';
import {
    sendSuccess,
    sendBadRequest,
    sendNotFound,
    sendInternalError,
    sendPaginated,
    sendValidationError
} from '../utils/response-helpers';
import {
    validateStockAdjustment,
    validateStockHistoryFilters,
    validateProductId,
    getValidationErrorMessage,
    getValidationErrorDetails
} from '../schemas/stock-adjustment.schemas';

/**
 * Stock Adjustment controller handling all stock adjustment-related HTTP requests
 */
export class StockAdjustmentController {
    /**
     * Adjust product stock
     * POST /api/products/:id/stock-adjustment
     */
    async adjustStock(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            // Validate product ID parameter
            const paramsValidation = validateProductId(request.params);

            if (!paramsValidation.success) {
                const errorMessage = getValidationErrorMessage(paramsValidation.error);
                const errorDetails = getValidationErrorDetails(paramsValidation.error);
                return sendValidationError(reply, errorMessage, errorDetails);
            }

            // Validate request body
            const bodyValidation = validateStockAdjustment(request.body);

            if (!bodyValidation.success) {
                const errorMessage = getValidationErrorMessage(bodyValidation.error);
                const errorDetails = getValidationErrorDetails(bodyValidation.error);
                return sendValidationError(reply, errorMessage, errorDetails);
            }

            const { id } = paramsValidation.data;
            const adjustmentData = bodyValidation.data;

            // Extract user information from request (assuming auth middleware sets this)
            const userId = (request as any).user?.id;
            const userName = (request as any).user?.name || 'Unknown User';
            const ipAddress = request.ip;
            const userAgent = request.headers['user-agent'];

            const result = await stockAdjustmentService.adjustStock(
                id,
                adjustmentData,
                userId,
                userName,
                ipAddress,
                userAgent
            );

            return sendSuccess(reply, result, 'Stock adjusted successfully');
        } catch (error) {
            console.error('Error adjusting stock:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to adjust stock';

            // Handle specific error cases
            if (errorMessage.includes('Product not found')) {
                return sendNotFound(reply, 'Product not found');
            }

            if (errorMessage.includes('Insufficient stock')) {
                return sendBadRequest(reply, errorMessage);
            }

            if (errorMessage.includes('Invalid adjustment')) {
                return sendBadRequest(reply, errorMessage);
            }

            return sendInternalError(reply, errorMessage);
        }
    }

    /**
     * Get stock adjustment history
     * GET /api/stock-adjustments
     */
    async getStockHistory(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            // Validate query parameters
            const filtersValidation = validateStockHistoryFilters(request.query);

            if (!filtersValidation.success) {
                const errorMessage = getValidationErrorMessage(filtersValidation.error);
                const errorDetails = getValidationErrorDetails(filtersValidation.error);
                return sendValidationError(reply, errorMessage, errorDetails);
            }

            const filters = filtersValidation.data;

            const adjustments = await stockAdjustmentService.getAdjustmentHistory(filters);
            const total = await stockAdjustmentService.countAdjustmentHistory(filters);

            return sendPaginated(
                reply,
                adjustments,
                total,
                filters.page || 1,
                filters.limit || 50,
                'Stock adjustment history retrieved successfully'
            );
        } catch (error) {
            console.error('Error getting stock history:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve stock history';
            return sendInternalError(reply, errorMessage);
        }
    }
}

// Export singleton instance
export const stockAdjustmentController = new StockAdjustmentController();