import { FastifyRequest, FastifyReply } from 'fastify';
import { priceService } from '../services/price.service';
import { ValidationError } from '../types/error.types';
import {
    sendSuccess,
    sendBadRequest,
    sendNotFound,
    sendInternalError,
    sendValidationError
} from '../utils/response-helpers';
import {
    validatePriceCalculationParams,
    validateMarginMarkupParams,
    validatePriceSuggestionParams,
    validatePriceProductId,
    getPriceValidationErrorMessage,
    getPriceValidationErrorDetails,
    PriceCalculationParams,
    PriceSuggestionParams
} from '../schemas/price.schemas';
import {
    auditLogger,
    PerformanceMonitor,
    RateLimiter,
    AuditLogEntry
} from '../utils/audit-logger';

/**
 * Price controller handling all price calculation HTTP requests
 */
export class PriceController {
    /**
     * Calculate price for a product with all components
     * POST /api/products/:id/calculate-price
     */
    async calculatePrice(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const requestId = this.generateRequestId();
        const startTime = Date.now();

        // Check rate limiting
        if (RateLimiter.shouldLimit(request.ip)) {
            return reply.status(429).send({
                success: false,
                message: 'Too many requests. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }

        // Start performance monitoring
        PerformanceMonitor.startRequest(requestId);

        try {
            // Log request start
            console.log(`[${requestId}] Price calculation request started`, {
                method: 'calculatePrice',
                productId: (request.params as any)?.id,
                timestamp: new Date().toISOString(),
                userAgent: request.headers['user-agent'],
                ip: request.ip
            });

            // Validate product ID parameter
            const paramsValidation = validatePriceProductId(request.params);

            if (!paramsValidation.success) {
                const errorMessage = getPriceValidationErrorMessage(paramsValidation.error);
                const errorDetails = getPriceValidationErrorDetails(paramsValidation.error);

                console.warn(`[${requestId}] Product ID validation failed`, {
                    error: errorMessage,
                    details: errorDetails,
                    params: request.params
                });

                return sendValidationError(reply, errorMessage, errorDetails);
            }

            // Validate request body
            const bodyValidation = validatePriceCalculationParams(request.body);

            if (!bodyValidation.success) {
                const errorMessage = getPriceValidationErrorMessage(bodyValidation.error);
                const errorDetails = getPriceValidationErrorDetails(bodyValidation.error);

                console.warn(`[${requestId}] Request body validation failed`, {
                    error: errorMessage,
                    details: errorDetails,
                    body: request.body
                });

                return sendValidationError(reply, errorMessage, errorDetails);
            }

            const { id } = paramsValidation.data;
            const calculationParams = bodyValidation.data;

            // Ensure productId from params matches the one in body (if provided)
            const finalParams: PriceCalculationParams = {
                ...calculationParams,
                productId: id
            };

            // Log calculation parameters
            console.log(`[${requestId}] Executing price calculation`, {
                productId: id,
                quantity: finalParams.quantity,
                customerId: finalParams.customerId,
                applyPromotions: finalParams.applyPromotions,
                includeTaxes: finalParams.includeTaxes
            });

            // Call price service for calculation
            const result = await priceService.calculatePrice(finalParams, requestId);

            // Log successful calculation
            const duration = Date.now() - startTime;
            console.log(`[${requestId}] Price calculation completed successfully`, {
                duration: `${duration}ms`,
                finalPrice: result.finalPrice,
                margin: result.margin.percentage,
                markup: result.markup.percentage
            });

            // Log audit entry
            const auditEntry: AuditLogEntry = {
                requestId,
                timestamp: new Date(),
                method: 'calculatePrice',
                userId: this.extractUserId(request),
                sessionId: this.extractSessionId(request),
                ip: request.ip,
                userAgent: request.headers['user-agent'],
                parameters: finalParams,
                result: {
                    finalPrice: result.finalPrice,
                    margin: result.margin.percentage,
                    markup: result.markup.percentage
                },
                duration,
                status: 'success'
            };
            auditLogger.logAudit(auditEntry);

            // End performance monitoring
            const responseSize = JSON.stringify(result).length;
            PerformanceMonitor.endRequest(requestId, 'calculatePrice', responseSize);

            return sendSuccess(reply, result, 'Price calculated successfully');
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`[${requestId}] Error calculating price`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                duration: `${duration}ms`,
                params: request.params,
                body: request.body
            });

            // Log error to audit
            if (error instanceof Error) {
                auditLogger.logError(requestId, 'calculatePrice', error, {
                    params: request.params,
                    body: request.body
                });
            }

            // Log audit entry for error
            const auditEntry: AuditLogEntry = {
                requestId,
                timestamp: new Date(),
                method: 'calculatePrice',
                userId: this.extractUserId(request),
                sessionId: this.extractSessionId(request),
                ip: request.ip,
                userAgent: request.headers['user-agent'],
                parameters: {
                    params: request.params,
                    body: request.body
                },
                duration,
                status: error instanceof ValidationError ? 'validation_error' : 'error',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    code: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
                    stack: error instanceof Error ? error.stack : undefined
                }
            };
            auditLogger.logAudit(auditEntry);

            // End performance monitoring
            PerformanceMonitor.endRequest(requestId, 'calculatePrice');

            // Handle ValidationError instances
            if (error instanceof ValidationError) {
                return sendValidationError(reply, error.message, error.details);
            }

            const errorMessage = error instanceof Error ? error.message : 'Failed to calculate price';

            // Handle specific business logic errors
            if (errorMessage.includes('Product not found')) {
                return sendNotFound(reply, 'Product not found');
            }

            if (errorMessage.includes('Customer not found')) {
                return sendNotFound(reply, 'Customer not found');
            }

            if (errorMessage.includes('Quantity must be greater than zero')) {
                return sendBadRequest(reply, 'Quantity must be greater than zero');
            }

            if (errorMessage.includes('Base price must be greater than zero')) {
                return sendBadRequest(reply, 'Base price must be greater than zero');
            }

            if (errorMessage.includes('Invalid') && errorMessage.includes('must be a valid number')) {
                return sendBadRequest(reply, errorMessage);
            }

            // Handle database connection errors
            if (errorMessage.includes('connection') || errorMessage.includes('database')) {
                return sendInternalError(reply, 'Database connection error. Please try again later.');
            }

            // Handle timeout errors
            if (errorMessage.includes('timeout')) {
                return sendInternalError(reply, 'Request timeout. Please try again.');
            }

            return sendInternalError(reply, 'An unexpected error occurred while calculating price');
        }
    }

    /**
     * Calculate margin and markup for given cost and selling price
     * POST /api/price/margin-markup
     */
    async calculateMarginMarkup(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const requestId = this.generateRequestId();
        const startTime = Date.now();

        // Check rate limiting
        if (RateLimiter.shouldLimit(request.ip)) {
            return reply.status(429).send({
                success: false,
                message: 'Too many requests. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }

        // Start performance monitoring
        PerformanceMonitor.startRequest(requestId);

        try {
            // Log request start
            console.log(`[${requestId}] Margin/markup calculation request started`, {
                method: 'calculateMarginMarkup',
                timestamp: new Date().toISOString(),
                userAgent: request.headers['user-agent'],
                ip: request.ip
            });

            // Validate request body
            const bodyValidation = validateMarginMarkupParams(request.body);

            if (!bodyValidation.success) {
                const errorMessage = getPriceValidationErrorMessage(bodyValidation.error);
                const errorDetails = getPriceValidationErrorDetails(bodyValidation.error);

                console.warn(`[${requestId}] Margin/markup validation failed`, {
                    error: errorMessage,
                    details: errorDetails,
                    body: request.body
                });

                return sendValidationError(reply, errorMessage, errorDetails);
            }

            const marginMarkupParams = bodyValidation.data;

            // Log calculation parameters
            console.log(`[${requestId}] Executing margin/markup calculation`, {
                cost: marginMarkupParams.cost,
                sellingPrice: marginMarkupParams.sellingPrice
            });

            // Call price service for margin/markup calculation
            const result = await priceService.calculateMarginMarkup(marginMarkupParams);

            // Log successful calculation
            const duration = Date.now() - startTime;
            console.log(`[${requestId}] Margin/markup calculation completed successfully`, {
                duration: `${duration}ms`,
                margin: result.margin.percentage,
                markup: result.markup.percentage,
                profit: result.profit
            });

            // Log audit entry
            const auditEntry: AuditLogEntry = {
                requestId,
                timestamp: new Date(),
                method: 'calculateMarginMarkup',
                userId: this.extractUserId(request),
                sessionId: this.extractSessionId(request),
                ip: request.ip,
                userAgent: request.headers['user-agent'],
                parameters: marginMarkupParams,
                result: {
                    margin: result.margin.percentage,
                    markup: result.markup.percentage,
                    profit: result.profit
                },
                duration,
                status: 'success'
            };
            auditLogger.logAudit(auditEntry);

            // End performance monitoring
            const responseSize = JSON.stringify(result).length;
            PerformanceMonitor.endRequest(requestId, 'calculateMarginMarkup', responseSize);

            return sendSuccess(reply, result, 'Margin and markup calculated successfully');
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`[${requestId}] Error calculating margin/markup`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                duration: `${duration}ms`,
                body: request.body
            });

            // Log error to audit
            if (error instanceof Error) {
                auditLogger.logError(requestId, 'calculateMarginMarkup', error, {
                    body: request.body
                });
            }

            // Log audit entry for error
            const auditEntry: AuditLogEntry = {
                requestId,
                timestamp: new Date(),
                method: 'calculateMarginMarkup',
                userId: this.extractUserId(request),
                sessionId: this.extractSessionId(request),
                ip: request.ip,
                userAgent: request.headers['user-agent'],
                parameters: { body: request.body },
                duration,
                status: error instanceof ValidationError ? 'validation_error' : 'error',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    code: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
                    stack: error instanceof Error ? error.stack : undefined
                }
            };
            auditLogger.logAudit(auditEntry);

            // End performance monitoring
            PerformanceMonitor.endRequest(requestId, 'calculateMarginMarkup');

            // Handle ValidationError instances
            if (error instanceof ValidationError) {
                return sendValidationError(reply, error.message, error.details);
            }

            const errorMessage = error instanceof Error ? error.message : 'Failed to calculate margin and markup';

            // Handle specific business logic errors
            if (errorMessage.includes('Cost must be greater than zero')) {
                return sendBadRequest(reply, 'Cost must be greater than zero');
            }

            if (errorMessage.includes('Selling price must be greater than zero')) {
                return sendBadRequest(reply, 'Selling price must be greater than zero');
            }

            if (errorMessage.includes('Selling price cannot be less than cost')) {
                return sendValidationError(reply, 'Selling price cannot be less than cost (would result in negative margin)');
            }

            if (errorMessage.includes('Invalid') && errorMessage.includes('must be a valid number')) {
                return sendBadRequest(reply, errorMessage);
            }

            // Handle mathematical errors
            if (errorMessage.includes('division by zero') || errorMessage.includes('NaN')) {
                return sendBadRequest(reply, 'Invalid calculation parameters provided');
            }

            return sendInternalError(reply, 'An unexpected error occurred while calculating margin and markup');
        }
    }

    /**
     * Suggest price based on target margin or markup
     * POST /api/products/:id/suggest-price
     */
    async suggestPrice(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const requestId = this.generateRequestId();
        const startTime = Date.now();

        // Check rate limiting
        if (RateLimiter.shouldLimit(request.ip)) {
            return reply.status(429).send({
                success: false,
                message: 'Too many requests. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }

        // Start performance monitoring
        PerformanceMonitor.startRequest(requestId);

        try {
            // Log request start
            console.log(`[${requestId}] Price suggestion request started`, {
                method: 'suggestPrice',
                productId: (request.params as any)?.id,
                timestamp: new Date().toISOString(),
                userAgent: request.headers['user-agent'],
                ip: request.ip
            });

            // Validate product ID parameter
            const paramsValidation = validatePriceProductId(request.params);

            if (!paramsValidation.success) {
                const errorMessage = getPriceValidationErrorMessage(paramsValidation.error);
                const errorDetails = getPriceValidationErrorDetails(paramsValidation.error);

                console.warn(`[${requestId}] Product ID validation failed`, {
                    error: errorMessage,
                    details: errorDetails,
                    params: request.params
                });

                return sendValidationError(reply, errorMessage, errorDetails);
            }

            // Validate request body
            const bodyValidation = validatePriceSuggestionParams(request.body);

            if (!bodyValidation.success) {
                const errorMessage = getPriceValidationErrorMessage(bodyValidation.error);
                const errorDetails = getPriceValidationErrorDetails(bodyValidation.error);

                console.warn(`[${requestId}] Price suggestion validation failed`, {
                    error: errorMessage,
                    details: errorDetails,
                    body: request.body
                });

                return sendValidationError(reply, errorMessage, errorDetails);
            }

            const { id } = paramsValidation.data;
            const suggestionParams = bodyValidation.data;

            // Ensure productId from params matches the one in body (if provided)
            const finalParams: PriceSuggestionParams = {
                ...suggestionParams,
                productId: id
            };

            // Log suggestion parameters
            console.log(`[${requestId}] Executing price suggestion`, {
                productId: id,
                targetMargin: finalParams.targetMargin,
                targetMarkup: finalParams.targetMarkup,
                customerId: finalParams.customerId,
                quantity: finalParams.quantity
            });

            // Call price service for price suggestion
            const result = await priceService.suggestPrice(finalParams, requestId);

            // Log successful suggestion
            const duration = Date.now() - startTime;
            console.log(`[${requestId}] Price suggestion completed successfully`, {
                duration: `${duration}ms`,
                suggestedPrice: result.suggestedPrice,
                currentPrice: result.currentPrice,
                projectedMargin: result.projectedMargin.percentage,
                projectedMarkup: result.projectedMarkup.percentage
            });

            // Log audit entry
            const auditEntry: AuditLogEntry = {
                requestId,
                timestamp: new Date(),
                method: 'suggestPrice',
                userId: this.extractUserId(request),
                sessionId: this.extractSessionId(request),
                ip: request.ip,
                userAgent: request.headers['user-agent'],
                parameters: finalParams,
                result: {
                    suggestedPrice: result.suggestedPrice,
                    currentPrice: result.currentPrice,
                    projectedMargin: result.projectedMargin.percentage,
                    projectedMarkup: result.projectedMarkup.percentage
                },
                duration,
                status: 'success'
            };
            auditLogger.logAudit(auditEntry);

            // End performance monitoring
            const responseSize = JSON.stringify(result).length;
            PerformanceMonitor.endRequest(requestId, 'suggestPrice', responseSize);

            return sendSuccess(reply, result, 'Price suggestion calculated successfully');
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`[${requestId}] Error suggesting price`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                duration: `${duration}ms`,
                params: request.params,
                body: request.body
            });

            // Log error to audit
            if (error instanceof Error) {
                auditLogger.logError(requestId, 'suggestPrice', error, {
                    params: request.params,
                    body: request.body
                });
            }

            // Log audit entry for error
            const auditEntry: AuditLogEntry = {
                requestId,
                timestamp: new Date(),
                method: 'suggestPrice',
                userId: this.extractUserId(request),
                sessionId: this.extractSessionId(request),
                ip: request.ip,
                userAgent: request.headers['user-agent'],
                parameters: {
                    params: request.params,
                    body: request.body
                },
                duration,
                status: error instanceof ValidationError ? 'validation_error' : 'error',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    code: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
                    stack: error instanceof Error ? error.stack : undefined
                }
            };
            auditLogger.logAudit(auditEntry);

            // End performance monitoring
            PerformanceMonitor.endRequest(requestId, 'suggestPrice');

            // Handle ValidationError instances
            if (error instanceof ValidationError) {
                return sendValidationError(reply, error.message, error.details);
            }

            const errorMessage = error instanceof Error ? error.message : 'Failed to suggest price';

            // Handle specific business logic errors
            if (errorMessage.includes('Product not found')) {
                return sendNotFound(reply, 'Product not found');
            }

            if (errorMessage.includes('Customer not found')) {
                return sendNotFound(reply, 'Customer not found');
            }

            if (errorMessage.includes('Cannot specify both target margin and target markup')) {
                return sendBadRequest(reply, 'Cannot specify both target margin and target markup. Choose one.');
            }

            if (errorMessage.includes('Must specify either target margin or target markup')) {
                return sendBadRequest(reply, 'Must specify either target margin or target markup');
            }

            if (errorMessage.includes('Target margin must be between 0 and 100')) {
                return sendBadRequest(reply, 'Target margin must be between 0 and 100 percent');
            }

            if (errorMessage.includes('Target markup must be greater than or equal to 0')) {
                return sendBadRequest(reply, 'Target markup must be greater than or equal to 0 percent');
            }

            if (errorMessage.includes('Invalid') && errorMessage.includes('must be a valid number')) {
                return sendBadRequest(reply, errorMessage);
            }

            // Handle mathematical errors
            if (errorMessage.includes('division by zero') || errorMessage.includes('NaN')) {
                return sendBadRequest(reply, 'Invalid calculation parameters provided');
            }

            // Handle database connection errors
            if (errorMessage.includes('connection') || errorMessage.includes('database')) {
                return sendInternalError(reply, 'Database connection error. Please try again later.');
            }

            // Handle timeout errors
            if (errorMessage.includes('timeout')) {
                return sendInternalError(reply, 'Request timeout. Please try again.');
            }

            return sendInternalError(reply, 'An unexpected error occurred while suggesting price');
        }
    }

    /**
     * Generate a unique request ID for logging and tracking
     */
    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Extract user ID from request (from JWT token or session)
     */
    private extractUserId(request: FastifyRequest): string | undefined {
        // Try to extract from JWT token
        const user = (request as any).user;
        if (user && user.id) {
            return user.id;
        }

        // Try to extract from authorization header
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            // In a real implementation, you would decode the JWT token
            // For now, return undefined as user extraction is not implemented
            return undefined;
        }

        return undefined;
    }

    /**
     * Extract session ID from request
     */
    private extractSessionId(request: FastifyRequest): string | undefined {
        // Try to extract from session cookie
        const sessionCookie = request.headers.cookie;
        if (sessionCookie) {
            const sessionMatch = sessionCookie.match(/session=([^;]+)/);
            if (sessionMatch) {
                return sessionMatch[1];
            }
        }

        // Try to extract from custom header
        const sessionHeader = request.headers['x-session-id'];
        if (sessionHeader && typeof sessionHeader === 'string') {
            return sessionHeader;
        }

        return undefined;
    }
}

// Export singleton instance
export const priceController = new PriceController();