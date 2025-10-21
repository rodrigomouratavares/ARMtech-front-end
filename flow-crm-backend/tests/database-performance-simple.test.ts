import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app';
import { checkDatabaseConnection } from '../src/db/connection';
import { getDatabaseConnectionManager } from '../src/utils/database-connection-manager';
import type { FastifyInstance } from 'fastify';

describe('Database Performance and Connection Pooling - Simple Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        // Verify database connection
        const isConnected = await checkDatabaseConnection();
        expect(isConnected).toBe(true);

        // Build the application
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        // Close the application
        await app.close();
    });

    describe('Connection Pool Performance', () => {
        it('should handle concurrent health check operations efficiently', async () => {
            const startTime = Date.now();
            const concurrentOperations = 20;

            // Create concurrent health check operations to test connection pooling
            const healthPromises = Array.from({ length: concurrentOperations }, () =>
                app.inject({
                    method: 'GET',
                    url: '/health'
                })
            );

            const responses = await Promise.all(healthPromises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Verify all operations succeeded
            responses.forEach((response) => {
                expect(response.statusCode).toBe(200);
                const healthData = JSON.parse(response.payload);
                expect(healthData.status).toBe('ok');
            });

            // Performance assertion - should complete within reasonable time
            expect(totalTime).toBeLessThan(2000); // 2 seconds for 20 concurrent operations
            console.log(`Concurrent health checks completed in ${totalTime}ms`);
        });

        it('should maintain connection pool limits and provide statistics', async () => {
            const connectionManager = getDatabaseConnectionManager();

            // Get initial connection stats
            const initialStats = connectionManager.getPoolStats();
            expect(initialStats.totalCount).toBeGreaterThanOrEqual(0);
            expect(initialStats.idleCount).toBeGreaterThanOrEqual(0);
            expect(initialStats.waitingCount).toBeGreaterThanOrEqual(0);

            // Perform multiple health check operations
            const operations = Array.from({ length: 10 }, () =>
                app.inject({
                    method: 'GET',
                    url: '/health'
                })
            );

            await Promise.all(operations);

            // Wait a moment for connections to be returned to pool
            await new Promise(resolve => setTimeout(resolve, 100));

            // Get final connection stats
            const finalStats = connectionManager.getPoolStats();

            // Verify connection pool is working properly
            expect(finalStats.totalCount).toBeGreaterThanOrEqual(initialStats.totalCount);
            expect(finalStats.totalCount).toBeLessThanOrEqual(20); // Should not exceed max pool size

            console.log('Initial connection stats:', initialStats);
            console.log('Final connection stats:', finalStats);
        });

        it('should handle database connection health checks', async () => {
            const connectionManager = getDatabaseConnectionManager();

            // Test connection health
            const isHealthy = await connectionManager.testConnection();
            expect(isHealthy).toBe(true);

            // Test health check endpoint
            const healthResponse = await app.inject({
                method: 'GET',
                url: '/health'
            });

            expect(healthResponse.statusCode).toBe(200);
            const healthData = JSON.parse(healthResponse.payload);
            expect(healthData.status).toBe('ok');
        });
    });

    describe('Database Performance Under Load', () => {
        it('should maintain performance with multiple concurrent requests', async () => {
            const batchSize = 30;
            const startTime = Date.now();

            // Create a large batch of health check requests
            const healthPromises = Array.from({ length: batchSize }, () =>
                app.inject({
                    method: 'GET',
                    url: '/health'
                })
            );

            await Promise.all(healthPromises);
            const totalTime = Date.now() - startTime;

            // Performance assertions
            expect(totalTime).toBeLessThan(3000); // 3 seconds for batch operations

            console.log(`Batch operations (${batchSize} requests): ${totalTime}ms`);
            console.log(`Average response time: ${(totalTime / batchSize).toFixed(2)}ms per request`);
        });

        it('should handle sequential database operations efficiently', async () => {
            const operationCount = 10;
            const startTime = Date.now();

            // Perform sequential health checks to test database performance
            for (let i = 0; i < operationCount; i++) {
                const response = await app.inject({
                    method: 'GET',
                    url: '/health'
                });
                expect(response.statusCode).toBe(200);
            }

            const totalTime = Date.now() - startTime;

            // Performance assertion
            expect(totalTime).toBeLessThan(1000); // 1 second for 10 sequential operations

            console.log(`Sequential operations (${operationCount} requests): ${totalTime}ms`);
            console.log(`Average response time: ${(totalTime / operationCount).toFixed(2)}ms per request`);
        });
    });

    describe('Connection Pool Monitoring', () => {
        it('should provide accurate connection pool statistics', async () => {
            const connectionManager = getDatabaseConnectionManager();

            // Get initial stats
            const initialStats = connectionManager.getPoolStats();

            // Perform some operations
            await app.inject({
                method: 'GET',
                url: '/health'
            });

            // Get updated stats
            const updatedStats = connectionManager.getPoolStats();

            // Verify stats are reasonable
            expect(updatedStats.totalCount).toBeGreaterThanOrEqual(0);
            expect(updatedStats.idleCount).toBeGreaterThanOrEqual(0);
            expect(updatedStats.waitingCount).toBeGreaterThanOrEqual(0);

            console.log('Connection pool statistics:', updatedStats);
        });

        it('should handle connection pool operations without errors', async () => {
            const connectionManager = getDatabaseConnectionManager();

            // Verify connection manager is available
            expect(connectionManager).toBeDefined();

            // Get stats before any operations
            const stats = connectionManager.getPoolStats();
            expect(stats).toBeDefined();
            expect(typeof stats.totalCount).toBe('number');
            expect(typeof stats.idleCount).toBe('number');
            expect(typeof stats.waitingCount).toBe('number');

            // Test that we can perform operations
            const testResponse = await app.inject({
                method: 'GET',
                url: '/health'
            });

            expect(testResponse.statusCode).toBe(200);

            // Note: Actual cleanup testing would require shutting down the app,
            // which is handled in the afterAll hook
        });
    });
});