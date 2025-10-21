/**
 * Monitoring Routes
 * Defines routes for system monitoring, cache management, and performance metrics
 */

import { FastifyInstance } from 'fastify';
import { monitoringController } from '../controllers/monitoring.controller';

/**
 * Register monitoring routes
 */
export async function monitoringRoutes(fastify: FastifyInstance) {
    // Cache statistics endpoint
    fastify.get('/cache-stats', {
        schema: {
            description: 'Get comprehensive cache statistics and performance metrics',
            tags: ['monitoring'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                caches: {
                                    type: 'object',
                                    properties: {
                                        product: {
                                            type: 'object',
                                            properties: {
                                                totalEntries: { type: 'number' },
                                                hitCount: { type: 'number' },
                                                missCount: { type: 'number' },
                                                hitRate: { type: 'number' },
                                                memoryUsage: { type: 'number' }
                                            }
                                        },
                                        customer: { type: 'object' },
                                        calculation: { type: 'object' },
                                        promotion: { type: 'object' },
                                        totalMemoryUsage: { type: 'number' }
                                    }
                                },
                                timestamp: { type: 'string' },
                                recommendations: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, monitoringController.getCacheStats.bind(monitoringController));

    // Database health endpoint
    fastify.get('/database-health', {
        schema: {
            description: 'Get database health status and performance analysis',
            tags: ['monitoring'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                health: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                                        responseTime: { type: 'number' },
                                        error: { type: 'string' }
                                    }
                                },
                                analysis: {
                                    type: 'object',
                                    properties: {
                                        recommendations: {
                                            type: 'array',
                                            items: { type: 'string' }
                                        },
                                        cacheStats: { type: 'object' }
                                    }
                                },
                                timestamp: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, monitoringController.getDatabaseHealth.bind(monitoringController));

    // Audit statistics endpoint
    fastify.get('/audit-stats', {
        schema: {
            description: 'Get audit log statistics and metrics',
            tags: ['monitoring'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                audit: {
                                    type: 'object',
                                    properties: {
                                        totalRequests: { type: 'number' },
                                        successRate: { type: 'number' },
                                        averageResponseTime: { type: 'number' },
                                        errorRate: { type: 'number' }
                                    }
                                },
                                timestamp: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, monitoringController.getAuditStats.bind(monitoringController));

    // Comprehensive system metrics endpoint
    fastify.get('/system-metrics', {
        schema: {
            description: 'Get comprehensive system metrics including cache, database, and system health',
            tags: ['monitoring'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                system: {
                                    type: 'object',
                                    properties: {
                                        uptime: { type: 'number' },
                                        uptimeFormatted: { type: 'string' },
                                        memory: {
                                            type: 'object',
                                            properties: {
                                                rss: { type: 'number' },
                                                heapUsed: { type: 'number' },
                                                heapTotal: { type: 'number' },
                                                external: { type: 'number' }
                                            }
                                        },
                                        nodeVersion: { type: 'string' },
                                        platform: { type: 'string' },
                                        arch: { type: 'string' }
                                    }
                                },
                                cache: { type: 'object' },
                                database: { type: 'object' },
                                audit: { type: 'object' },
                                timestamp: { type: 'string' },
                                recommendations: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, monitoringController.getSystemMetrics.bind(monitoringController));

    // Clear caches endpoint
    fastify.post('/clear-caches', {
        schema: {
            description: 'Clear all application caches',
            tags: ['monitoring'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                message: { type: 'string' },
                                timestamp: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, monitoringController.clearCaches.bind(monitoringController));

    // Warm up caches endpoint
    fastify.post('/warm-up-caches', {
        schema: {
            description: 'Warm up caches with frequently accessed data',
            tags: ['monitoring'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                message: { type: 'string' },
                                timestamp: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, monitoringController.warmUpCaches.bind(monitoringController));
}