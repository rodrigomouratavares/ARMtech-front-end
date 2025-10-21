import { FastifyInstance } from 'fastify';
import { priceController } from '../controllers/price.controller';
import { validateRateLimit } from '../utils/validation-middleware';

/**
 * Price calculation routes with comprehensive validation and security
 */
export async function priceRoutes(fastify: FastifyInstance): Promise<void> {
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

    // Enhanced rate limiting middleware - 100 requests per minute per IP
    const rateLimiter = validateRateLimit({
        maxRequests: 100,
        windowMs: 60 * 1000 // 1 minute
    });

    // Request size and timeout middleware
    const requestLimits = async (request: any, reply: any) => {
        // Set request timeout (30 seconds)
        const timeout = setTimeout(() => {
            if (!reply.sent) {
                reply.status(408).send({
                    success: false,
                    error: {
                        code: 'REQUEST_TIMEOUT',
                        message: 'Request timeout - calculation took too long'
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }, 30000);

        // Clear timeout when request completes
        reply.raw.on('finish', () => {
            clearTimeout(timeout);
        });

        // Check request body size (limit to 1MB)
        const contentLength = request.headers['content-length'];
        if (contentLength && parseInt(contentLength) > 1024 * 1024) {
            return reply.status(413).send({
                success: false,
                error: {
                    code: 'PAYLOAD_TOO_LARGE',
                    message: 'Request body too large (max 1MB)'
                },
                timestamp: new Date().toISOString()
            });
        }
    };

    // Audit logging middleware for all price calculation requests
    const auditLogger = async (request: any, reply: any) => {
        const startTime = Date.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Log request start
        fastify.log.info(`Price calculation request started - ${request.method} ${request.url} - IP: ${request.ip} - RequestID: ${requestId}`);

        // Add response time logging
        reply.raw.on('finish', () => {
            const duration = Date.now() - startTime;
            fastify.log.info(`Price calculation request completed - ${request.method} ${request.url} - Status: ${reply.statusCode} - Duration: ${duration}ms`);

            // Alert for slow requests (> 2 seconds)
            if (duration > 2000) {
                fastify.log.warn(`Slow price calculation request detected - ${request.method} ${request.url} - Duration: ${duration}ms (threshold: 2000ms)`);
            }
        });
    };

    // Enhanced security headers middleware
    const securityHeaders = async (request: any, reply: any) => {
        // Basic security headers
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('X-Frame-Options', 'DENY');
        reply.header('X-XSS-Protection', '1; mode=block');
        reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Content Security Policy
        reply.header('Content-Security-Policy', "default-src 'self'; script-src 'none'; object-src 'none'");

        // Additional security headers
        reply.header('X-Permitted-Cross-Domain-Policies', 'none');
        reply.header('Cross-Origin-Embedder-Policy', 'require-corp');
        reply.header('Cross-Origin-Opener-Policy', 'same-origin');
        reply.header('Cross-Origin-Resource-Policy', 'same-origin');

        // Cache control for sensitive data
        reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        reply.header('Pragma', 'no-cache');
        reply.header('Expires', '0');
    };

    // Input sanitization middleware
    const inputSanitizer = async (request: any, reply: any) => {
        // Sanitize request body if present
        if (request.body && typeof request.body === 'object') {
            request.body = sanitizeObject(request.body);
        }

        // Sanitize query parameters
        if (request.query && typeof request.query === 'object') {
            request.query = sanitizeObject(request.query);
        }

        // Log suspicious patterns
        const requestStr = JSON.stringify({ body: request.body, query: request.query });
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /eval\s*\(/i,
            /expression\s*\(/i
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(requestStr)) {
                fastify.log.warn(`Suspicious input detected from IP ${request.ip}: ${pattern.source}`);
                break;
            }
        }
    };

    // Helper function to sanitize objects recursively
    const sanitizeObject = (obj: any): any => {
        if (obj === null || obj === undefined) {
            return obj;
        }

        if (typeof obj === 'string') {
            return sanitizeString(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }

        if (typeof obj === 'object') {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = sanitizeObject(value);
            }
            return sanitized;
        }

        return obj;
    };

    // Helper function to sanitize strings
    const sanitizeString = (str: string): string => {
        if (typeof str !== 'string') {
            return str;
        }

        // Remove potentially dangerous patterns
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    };

    // Combined middleware for all price routes
    const priceMiddleware = [authenticate, rateLimiter, requestLimits, securityHeaders, inputSanitizer, auditLogger];

    /**
     * Calculate price for a specific product
     * POST /api/products/:id/calculate-price
     * 
     * @description Calculates comprehensive price breakdown including discounts, taxes, margin, and markup
     * @param {string} id - Product ID (UUID format)
     * @body {PriceCalculationParams} - Calculation parameters
     * @returns {PriceCalculationResult} - Complete price calculation result
     * 
     * @example
     * Request:
     * POST /api/products/123e4567-e89b-12d3-a456-426614174000/calculate-price
     * {
     *   "quantity": "10",
     *   "customerId": "456e7890-e89b-12d3-a456-426614174001",
     *   "applyPromotions": true,
     *   "includeTaxes": true
     * }
     * 
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "productId": "123e4567-e89b-12d3-a456-426614174000",
     *     "quantity": 10,
     *     "basePrice": 100.00,
     *     "subtotal": 1000.00,
     *     "discounts": {
     *       "customerDiscount": 50.00,
     *       "promotionalDiscount": 25.00,
     *       "totalDiscount": 75.00
     *     },
     *     "taxes": {
     *       "amount": 92.50,
     *       "rate": 10
     *     },
     *     "finalPrice": 1017.50,
     *     "margin": {
     *       "amount": 317.50,
     *       "percentage": 31.20
     *     },
     *     "markup": {
     *       "amount": 317.50,
     *       "percentage": 45.36
     *     }
     *   }
     * }
     */
    fastify.post('/:id/calculate-price', {
        preHandler: priceMiddleware,
        schema: {
            tags: ['Price Calculation'],
            summary: 'Calculate product price with all components',
            description: 'Calculates comprehensive price breakdown including base price, discounts, taxes, margin, and markup for a specific product and quantity',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Product ID in UUID format'
                    }
                },
                required: ['id']
            },
            body: {
                type: 'object',
                properties: {
                    quantity: {
                        type: 'string',
                        pattern: '^[0-9]+(\\.[0-9]+)?$',
                        description: 'Product quantity (positive number as string)'
                    },
                    basePrice: {
                        type: 'string',
                        pattern: '^[0-9]+(\\.[0-9]+)?$',
                        description: 'Optional base price override (positive number as string)'
                    },
                    customerId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Optional customer ID for personalized discounts'
                    },
                    applyPromotions: {
                        type: 'boolean',
                        description: 'Whether to apply active promotions',
                        default: true
                    },
                    includeTaxes: {
                        type: 'boolean',
                        description: 'Whether to include taxes in calculation',
                        default: true
                    }
                },
                required: ['quantity']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                productId: { type: 'string' },
                                quantity: { type: 'number' },
                                basePrice: { type: 'number' },
                                subtotal: { type: 'number' },
                                discounts: {
                                    type: 'object',
                                    properties: {
                                        customerDiscount: { type: 'number' },
                                        promotionalDiscount: { type: 'number' },
                                        totalDiscount: { type: 'number' }
                                    }
                                },
                                taxes: {
                                    type: 'object',
                                    properties: {
                                        amount: { type: 'number' },
                                        rate: { type: 'number' }
                                    }
                                },
                                finalPrice: { type: 'number' },
                                margin: {
                                    type: 'object',
                                    properties: {
                                        amount: { type: 'number' },
                                        percentage: { type: 'number' }
                                    }
                                },
                                markup: {
                                    type: 'object',
                                    properties: {
                                        amount: { type: 'number' },
                                        percentage: { type: 'number' }
                                    }
                                }
                            }
                        },
                        message: { type: 'string' },
                        timestamp: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return priceController.calculatePrice(request, reply);
    });

    /**
     * Calculate margin and markup from cost and selling price
     * POST /api/price/margin-markup
     * 
     * @description Calculates margin and markup percentages from given cost and selling price
     * @body {MarginMarkupParams} - Cost and selling price parameters
     * @returns {MarginMarkupResult} - Margin and markup calculation result
     * 
     * @example
     * Request:
     * POST /api/price/margin-markup
     * {
     *   "cost": "70.00",
     *   "sellingPrice": "100.00"
     * }
     * 
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "cost": 70.00,
     *     "sellingPrice": 100.00,
     *     "profit": 30.00,
     *     "margin": {
     *       "amount": 30.00,
     *       "percentage": 30.00
     *     },
     *     "markup": {
     *       "amount": 30.00,
     *       "percentage": 42.86
     *     }
     *   }
     * }
     */
    fastify.post('/margin-markup', {
        preHandler: priceMiddleware,
        schema: {
            tags: ['Price Calculation'],
            summary: 'Calculate margin and markup from cost and selling price',
            description: 'Calculates margin and markup percentages and amounts from given cost and selling price values',
            body: {
                type: 'object',
                properties: {
                    cost: {
                        type: 'string',
                        pattern: '^[0-9]+(\\.[0-9]+)?$',
                        description: 'Product cost (positive number as string)'
                    },
                    sellingPrice: {
                        type: 'string',
                        pattern: '^[0-9]+(\\.[0-9]+)?$',
                        description: 'Selling price (positive number as string, must be >= cost)'
                    }
                },
                required: ['cost', 'sellingPrice']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                cost: { type: 'number' },
                                sellingPrice: { type: 'number' },
                                profit: { type: 'number' },
                                margin: {
                                    type: 'object',
                                    properties: {
                                        amount: { type: 'number' },
                                        percentage: { type: 'number' }
                                    }
                                },
                                markup: {
                                    type: 'object',
                                    properties: {
                                        amount: { type: 'number' },
                                        percentage: { type: 'number' }
                                    }
                                }
                            }
                        },
                        message: { type: 'string' },
                        timestamp: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return priceController.calculateMarginMarkup(request, reply);
    });

    /**
     * Suggest optimal price based on target margin or markup
     * POST /api/products/:id/suggest-price
     * 
     * @description Suggests optimal selling price based on target margin or markup percentage
     * @param {string} id - Product ID (UUID format)
     * @body {PriceSuggestionParams} - Target margin/markup parameters
     * @returns {PriceSuggestionResult} - Price suggestion with projections
     * 
     * @example
     * Request:
     * POST /api/products/123e4567-e89b-12d3-a456-426614174000/suggest-price
     * {
     *   "targetMargin": 35,
     *   "customerId": "456e7890-e89b-12d3-a456-426614174001",
     *   "quantity": "10"
     * }
     * 
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "productId": "123e4567-e89b-12d3-a456-426614174000",
     *     "suggestedPrice": 107.69,
     *     "currentPrice": 100.00,
     *     "cost": 70.00,
     *     "projectedMargin": {
     *       "amount": 37.69,
     *       "percentage": 35.00
     *     },
     *     "projectedMarkup": {
     *       "amount": 37.69,
     *       "percentage": 53.84
     *     },
     *     "recommendations": [
     *       "Suggested price achieves target margin of 35%",
     *       "Price increase of 7.69% from current price"
     *     ]
     *   }
     * }
     */
    fastify.post('/:id/suggest-price', {
        preHandler: priceMiddleware,
        schema: {
            tags: ['Price Calculation'],
            summary: 'Suggest optimal price based on target margin or markup',
            description: 'Calculates and suggests optimal selling price to achieve target margin or markup percentage',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Product ID in UUID format'
                    }
                },
                required: ['id']
            },
            body: {
                type: 'object',
                properties: {
                    targetMargin: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100,
                        description: 'Target margin percentage (0-100). Cannot be used with targetMarkup.'
                    },
                    targetMarkup: {
                        type: 'number',
                        minimum: 0,
                        description: 'Target markup percentage (>= 0). Cannot be used with targetMargin.'
                    },
                    customerId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Optional customer ID for personalized calculations'
                    },
                    quantity: {
                        type: 'string',
                        pattern: '^[0-9]+(\\.[0-9]+)?$',
                        description: 'Optional quantity for volume-based calculations'
                    }
                },
                anyOf: [
                    { required: ['targetMargin'] },
                    { required: ['targetMarkup'] }
                ]
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                productId: { type: 'string' },
                                suggestedPrice: { type: 'number' },
                                currentPrice: { type: 'number' },
                                cost: { type: 'number' },
                                projectedMargin: {
                                    type: 'object',
                                    properties: {
                                        amount: { type: 'number' },
                                        percentage: { type: 'number' }
                                    }
                                },
                                projectedMarkup: {
                                    type: 'object',
                                    properties: {
                                        amount: { type: 'number' },
                                        percentage: { type: 'number' }
                                    }
                                },
                                recommendations: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        },
                        message: { type: 'string' },
                        timestamp: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return priceController.suggestPrice(request, reply);
    });

    fastify.log.info('Price calculation routes registered with comprehensive validation, rate limiting, and documentation');
}