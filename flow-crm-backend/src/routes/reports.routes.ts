import { FastifyInstance } from 'fastify';
import { reportsController } from '../controllers/reports.controller';
import { authenticateUser } from '../middlewares/auth.middleware';

/**
 * Reports routes plugin
 */
export async function reportsRoutes(fastify: FastifyInstance) {
    // Apply authentication middleware to all routes
    fastify.addHook('preHandler', authenticateUser);

    // Apply permission check for reports access
    fastify.addHook('preHandler', async (request, reply) => {
        const user = request.user;

        if (!user) {
            return reply.status(401).send({
                success: false,
                message: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }

        // Check if user has reports permission
        // Admin users should have automatic access to all modules
        const isAdmin = user.role === 'admin';
        const permissions = user.permissions || {};
        const hasReportsPermission = isAdmin || permissions.modules?.reports === true;

        if (!hasReportsPermission) {
            return reply.status(403).send({
                success: false,
                message: 'Access denied. Reports permission required.',
                code: 'FORBIDDEN'
            });
        }
    });

    // GET /api/reports/payment-methods - Get payment methods report
    fastify.get('/payment-methods', {
        schema: {
            description: 'Get payment methods report with aggregated sales data',
            tags: ['Reports'],
            querystring: {
                type: 'object',
                properties: {
                    startDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Start date for filtering (ISO 8601 format)'
                    },
                    endDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'End date for filtering (ISO 8601 format)'
                    },
                    paymentMethodId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Filter by specific payment method ID'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    paymentMethod: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            code: { type: 'string' },
                                            description: { type: 'string' },
                                            isActive: { type: 'boolean' },
                                            createdAt: { type: 'string', format: 'date-time' },
                                            updatedAt: { type: 'string', format: 'date-time' }
                                        }
                                    },
                                    totalAmount: { type: 'number' },
                                    salesCount: { type: 'number' },
                                    convertedPresalesCount: { type: 'number' },
                                    convertedPresalesAmount: { type: 'number' }
                                }
                            }
                        },
                        message: { type: 'string' }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        code: { type: 'string' }
                    }
                },
                403: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        code: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        code: { type: 'string' }
                    }
                }
            }
        },
        handler: reportsController.getPaymentMethodsReport.bind(reportsController)
    });

    // GET /api/reports/summary - Get report summary
    fastify.get('/summary', {
        schema: {
            description: 'Get report summary with total aggregated data',
            tags: ['Reports'],
            querystring: {
                type: 'object',
                properties: {
                    startDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Start date for filtering (ISO 8601 format)'
                    },
                    endDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'End date for filtering (ISO 8601 format)'
                    },
                    paymentMethodId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Filter by specific payment method ID'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                totalAmount: { type: 'number' },
                                totalSalesCount: { type: 'number' },
                                totalConvertedPresales: { type: 'number' },
                                totalConvertedPresalesAmount: { type: 'number' },
                                period: {
                                    type: 'object',
                                    properties: {
                                        startDate: { type: 'string', format: 'date-time' },
                                        endDate: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        },
                        message: { type: 'string' }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        code: { type: 'string' }
                    }
                },
                403: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        code: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        code: { type: 'string' }
                    }
                }
            }
        },
        handler: reportsController.getReportSummary.bind(reportsController)
    });
}