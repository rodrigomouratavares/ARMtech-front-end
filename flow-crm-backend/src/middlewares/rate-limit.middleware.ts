import { FastifyRequest, FastifyReply } from 'fastify';
import { auditLogger, RateLimiter } from '../utils/audit-logger';

/**
 * Rate limiting middleware factory for different endpoints
 */
export function createRateLimitMiddleware(options: {
    maxRequests?: number;
    windowSizeMs?: number;
    message?: string;
} = {}) {
    const {
        maxRequests = 50, // Default: 50 requests per window
        windowSizeMs = 60 * 1000, // Default: 1 minute window
        message = 'Too many requests. Please try again later.'
    } = options;

    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
            const ip = request.ip;
            const now = new Date();

            // Use the existing RateLimiter but with custom limits for stock adjustments
            if (shouldLimitStockAdjustment(ip, maxRequests, windowSizeMs)) {
                // Log the rate limit violation
                auditLogger.logRateLimit({
                    ip,
                    timestamp: now,
                    requestCount: maxRequests + 1, // Exceeded count
                    windowStart: now,
                    blocked: true
                });

                request.log.warn('Rate limit exceeded for stock adjustment', {
                    ip,
                    url: request.url,
                    userAgent: request.headers['user-agent']
                } as any);

                return reply.status(429).send({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message,
                        retryAfter: Math.ceil(windowSizeMs / 1000)
                    },
                    timestamp: now.toISOString(),
                    path: request.url
                });
            }

            // Log successful rate limit check
            request.log.debug('Rate limit check passed', {
                ip,
                endpoint: request.url
            } as any);

        } catch (error) {
            request.log.error('Error in rate limiting middleware:', error as any);
            // Don't block the request if rate limiting fails
        }
    };
}

/**
 * Stock adjustment specific rate limiter
 * More restrictive than general API rate limiting
 */
const stockAdjustmentCounts = new Map<string, {
    count: number;
    windowStart: Date;
}>();

function shouldLimitStockAdjustment(ip: string, maxRequests: number, windowSizeMs: number): boolean {
    const now = new Date();
    const existing = stockAdjustmentCounts.get(ip);

    if (!existing || (now.getTime() - existing.windowStart.getTime()) > windowSizeMs) {
        // New window or first request
        stockAdjustmentCounts.set(ip, {
            count: 1,
            windowStart: now
        });
        return false;
    }

    // Increment count
    existing.count++;
    return existing.count > maxRequests;
}

/**
 * Cleanup old rate limit entries periodically
 */
export function cleanupStockAdjustmentRateLimit(): void {
    const now = new Date();
    const cutoff = now.getTime() - (60 * 1000); // 1 minute

    for (const [ip, data] of stockAdjustmentCounts.entries()) {
        if (data.windowStart.getTime() < cutoff) {
            stockAdjustmentCounts.delete(ip);
        }
    }
}

/**
 * Standard rate limiting for stock adjustment operations
 * 20 requests per minute per IP
 */
export const stockAdjustmentRateLimit = createRateLimitMiddleware({
    maxRequests: 20,
    windowSizeMs: 60 * 1000,
    message: 'Too many stock adjustment requests. Please wait before trying again.'
});

/**
 * Rate limiting for stock history queries
 * 100 requests per minute per IP
 */
export const stockHistoryRateLimit = createRateLimitMiddleware({
    maxRequests: 100,
    windowSizeMs: 60 * 1000,
    message: 'Too many stock history requests. Please wait before trying again.'
});

// Set up periodic cleanup
setInterval(cleanupStockAdjustmentRateLimit, 5 * 60 * 1000); // Every 5 minutes