/**
 * Audit Logging Tests
 * Tests for audit logging, performance monitoring, and caching functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuditLogger, PerformanceMonitor, RateLimiter } from '../src/utils/audit-logger';
import { CacheManager, productCache, customerCache } from '../src/utils/cache-manager';
import { DatabaseOptimizer } from '../src/utils/database-optimizer';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('Audit Logging System', () => {
    let testLogger: AuditLogger;
    const testLogDir = join(process.cwd(), 'test-logs');

    beforeEach(() => {
        testLogger = new AuditLogger({
            logDir: testLogDir,
            retentionDays: 30
        });
    });

    afterEach(() => {
        // Clean up test log files
        const logFiles = [
            'price-audit.log',
            'price-performance.log',
            'rate-limit.log',
            'price-errors.log'
        ];

        for (const file of logFiles) {
            const filePath = join(testLogDir, file);
            if (existsSync(filePath)) {
                try {
                    unlinkSync(filePath);
                } catch (error) {
                    // Ignore cleanup errors
                }
            }
        }

        testLogger.destroy();
    });

    it('should log audit entries correctly', () => {
        const auditEntry = {
            requestId: 'test-req-123',
            timestamp: new Date(),
            method: 'calculatePrice',
            userId: 'user-123',
            sessionId: 'session-456',
            ip: '127.0.0.1',
            userAgent: 'test-agent',
            parameters: { productId: 'prod-123', quantity: 2 },
            result: { finalPrice: 100.50 },
            duration: 150,
            status: 'success' as const
        };

        expect(() => {
            testLogger.logAudit(auditEntry);
        }).not.toThrow();

        // Check if audit log file was created
        const auditLogPath = join(testLogDir, 'price-audit.log');
        expect(existsSync(auditLogPath)).toBe(true);
    });

    it('should log performance metrics correctly', () => {
        const performanceMetrics = {
            requestId: 'test-req-123',
            timestamp: new Date(),
            method: 'calculatePrice',
            duration: 250,
            memoryUsage: {
                rss: 50 * 1024 * 1024,
                heapUsed: 30 * 1024 * 1024,
                heapTotal: 40 * 1024 * 1024,
                external: 5 * 1024 * 1024
            },
            responseSize: 1024,
            dbQueryCount: 2,
            dbQueryTime: 50
        };

        expect(() => {
            testLogger.logPerformance(performanceMetrics);
        }).not.toThrow();

        // Check if performance log file was created
        const performanceLogPath = join(testLogDir, 'price-performance.log');
        expect(existsSync(performanceLogPath)).toBe(true);
    });

    it('should log errors correctly', () => {
        const error = new Error('Test error message');
        const parameters = { productId: 'invalid-id' };

        expect(() => {
            testLogger.logError('test-req-123', 'calculatePrice', error, parameters);
        }).not.toThrow();

        // Check if error log file was created
        const errorLogPath = join(testLogDir, 'price-errors.log');
        expect(existsSync(errorLogPath)).toBe(true);
    });
});

describe('Performance Monitor', () => {
    it('should track request performance correctly', () => {
        const requestId = 'perf-test-123';

        // Start monitoring
        PerformanceMonitor.startRequest(requestId);

        // Record some database queries
        PerformanceMonitor.recordDbQuery(requestId, 25);
        PerformanceMonitor.recordDbQuery(requestId, 35);

        // End monitoring
        expect(() => {
            PerformanceMonitor.endRequest(requestId, 'calculatePrice', 512);
        }).not.toThrow();
    });
});

describe('Rate Limiter', () => {
    it('should allow requests within limit', () => {
        const testIp = '192.168.1.100';

        // First request should be allowed
        expect(RateLimiter.shouldLimit(testIp)).toBe(false);

        // Multiple requests within limit should be allowed
        for (let i = 0; i < 50; i++) {
            expect(RateLimiter.shouldLimit(testIp)).toBe(false);
        }
    });

    it('should block requests exceeding limit', () => {
        const testIp = '192.168.1.101';

        // Make requests up to the limit
        for (let i = 0; i < 100; i++) {
            RateLimiter.shouldLimit(testIp);
        }

        // Next request should be blocked
        expect(RateLimiter.shouldLimit(testIp)).toBe(true);
    });
});

describe('Cache Manager', () => {
    let cache: CacheManager<string>;

    beforeEach(() => {
        cache = new CacheManager<string>({
            maxSize: 10,
            defaultTtl: 1000, // 1 second for testing
            cleanupInterval: 500 // 0.5 seconds for testing
        });
    });

    afterEach(() => {
        cache.destroy();
    });

    it('should store and retrieve values correctly', () => {
        cache.set('key1', 'value1');
        expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
        expect(cache.get('non-existent')).toBe(null);
    });

    it('should respect TTL and expire entries', async () => {
        cache.set('temp-key', 'temp-value', 100); // 100ms TTL
        expect(cache.get('temp-key')).toBe('temp-value');

        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 150));
        expect(cache.get('temp-key')).toBe(null);
    });

    it('should provide accurate statistics', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.get('key1'); // Hit
        cache.get('key3'); // Miss

        const stats = cache.getStats();
        expect(stats.totalEntries).toBe(2);
        expect(stats.hitCount).toBe(1);
        expect(stats.missCount).toBe(1);
        expect(stats.hitRate).toBe(50);
    });

    it('should handle getOrSet pattern correctly', async () => {
        let computeCallCount = 0;
        const computeFn = async () => {
            computeCallCount++;
            return 'computed-value';
        };

        // First call should compute
        const result1 = await cache.getOrSet('compute-key', computeFn);
        expect(result1).toBe('computed-value');
        expect(computeCallCount).toBe(1);

        // Second call should use cache
        const result2 = await cache.getOrSet('compute-key', computeFn);
        expect(result2).toBe('computed-value');
        expect(computeCallCount).toBe(1); // Should not increment
    });
});

describe('Database Optimizer', () => {
    it('should check database health', async () => {
        const health = await DatabaseOptimizer.checkDatabaseHealth();

        expect(health).toHaveProperty('status');
        expect(health).toHaveProperty('responseTime');
        expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
        expect(typeof health.responseTime).toBe('number');
    });

    it('should analyze query performance', () => {
        const analysis = DatabaseOptimizer.analyzeQueryPerformance();

        expect(analysis).toHaveProperty('recommendations');
        expect(analysis).toHaveProperty('cacheStats');
        expect(Array.isArray(analysis.recommendations)).toBe(true);
    });
});

describe('Cache Integration', () => {
    beforeEach(() => {
        // Clear caches before each test
        productCache.clear();
        customerCache.clear();
    });

    it('should cache products correctly', () => {
        const testProduct = {
            id: 'prod-123',
            name: 'Test Product',
            salePrice: '100.00',
            purchasePrice: '80.00'
        };

        productCache.set('prod-123', testProduct);
        const cached = productCache.get('prod-123');

        expect(cached).toEqual(testProduct);
    });

    it('should cache customers correctly', () => {
        const testCustomer = {
            id: 'cust-123',
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '123-456-7890'
        };

        customerCache.set('cust-123', testCustomer);
        const cached = customerCache.get('cust-123');

        expect(cached).toEqual(testCustomer);
    });
});