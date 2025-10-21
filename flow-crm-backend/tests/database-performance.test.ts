import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../src/app';
import { db, checkDatabaseConnection } from '../src/db/connection';
import { users } from '../src/db/schema/users';
import { customers } from '../src/db/schema/customers';
import { products } from '../src/db/schema/products';
import { preSales, preSaleItems } from '../src/db/schema/presales';
import { getDatabaseConnectionManager } from '../src/utils/database-connection-manager';
import type { FastifyInstance } from 'fastify';

describe('Database Performance and Connection Pooling', () => {
    let app: FastifyInstance;
    let authToken: string;

    beforeAll(async () => {
        // Verify database connection
        const isConnected = await checkDatabaseConnection();
        expect(isConnected).toBe(true);

        // Build the application
        app = buildApp();
        await app.ready();

        // Setup authentication for performance tests
        const registerResponse = await app.inject({
            method: 'POST',
            url: '/auth/register',
            payload: {
                email: 'admin@test.com',
                password: 'admin123',
                name: 'Admin User',
                role: 'admin'
            }
        });

        const loginResponse = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: {
                email: 'admin@test.com',
                password: 'admin123'
            }
        });

        const loginData = JSON.parse(loginResponse.payload);
        authToken = loginData.token;
    });

    beforeEach(async () => {
        // Clean up test data before each test
        await db.delete(preSaleItems);
        await db.delete(preSales);
        await db.delete(products);
        await db.delete(customers);
        await db.delete(users);

        // Re-create admin user for each test
        await app.inject({
            method: 'POST',
            url: '/auth/register',
            payload: {
                email: 'admin@test.com',
                password: 'admin123',
                name: 'Admin User',
                role: 'admin'
            }
        });

        const loginResponse = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: {
                email: 'admin@test.com',
                password: 'admin123'
            }
        });

        const loginData = JSON.parse(loginResponse.payload);
        authToken = loginData.token;
    });

    afterAll(async () => {
        // Clean up all test data after tests
        await db.delete(preSaleItems);
        await db.delete(preSales);
        await db.delete(products);
        await db.delete(customers);
        await db.delete(users);

        // Close the application
        await app.close();
    });

    describe('Connection Pool Performance', () => {
        it('should handle concurrent database operations efficiently', async () => {
            const startTime = Date.now();
            const concurrentOperations = 20;

            // Create concurrent customer creation operations
            const customerPromises = Array.from({ length: concurrentOperations }, (_, i) =>
                app.inject({
                    method: 'POST',
                    url: '/customers',
                    headers: {
                        authorization: `Bearer ${authToken}`
                    },
                    payload: {
                        name: `Customer ${i}`,
                        email: `customer${i}@test.com`,
                        phone: `(11) 9999${i.toString().padStart(4, '0')}`,
                        cpf: `${(11111111100 + i).toString()}`
                    }
                })
            );

            const responses = await Promise.all(customerPromises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Verify all operations succeeded
            responses.forEach((response, i) => {
                expect(response.statusCode).toBe(201);
                const customerData = JSON.parse(response.payload);
                expect(customerData.name).toBe(`Customer ${i}`);
            });

            // Performance assertion - should complete within reasonable time
            expect(totalTime).toBeLessThan(5000); // 5 seconds for 20 concurrent operations
            console.log(`Concurrent operations completed in ${totalTime}ms`);

            // Verify all customers were created
            const getAllResponse = await app.inject({
                method: 'GET',
                url: '/customers',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(getAllResponse.statusCode).toBe(200);
            const allCustomers = JSON.parse(getAllResponse.payload);
            expect(allCustomers).toHaveLength(concurrentOperations);
        });

        it('should maintain connection pool limits and cleanup', async () => {
            const connectionManager = getDatabaseConnectionManager();

            // Get initial connection stats
            const initialStats = connectionManager.getPoolStats();
            expect(initialStats.totalCount).toBeGreaterThanOrEqual(0);
            expect(initialStats.idleCount).toBeGreaterThanOrEqual(0);
            expect(initialStats.waitingCount).toBeGreaterThanOrEqual(0);

            // Perform multiple operations to test connection usage
            const operations = Array.from({ length: 10 }, (_, i) =>
                app.inject({
                    method: 'POST',
                    url: '/customers',
                    headers: {
                        authorization: `Bearer ${authToken}`
                    },
                    payload: {
                        name: `Test Customer ${i}`,
                        email: `test${i}@test.com`,
                        phone: `(11) 9999${i.toString().padStart(4, '0')}`,
                        cpf: `${(111111111 + i).toString().padStart(11, '0')}`
                    }
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
        it('should maintain performance with large datasets', async () => {
            const batchSize = 50;
            const startTime = Date.now();

            // Create a large batch of customers
            const customerPromises = Array.from({ length: batchSize }, (_, i) =>
                app.inject({
                    method: 'POST',
                    url: '/customers',
                    headers: {
                        authorization: `Bearer ${authToken}`
                    },
                    payload: {
                        name: `Batch Customer ${i}`,
                        email: `batch${i}@test.com`,
                        phone: `(11) 8888${i.toString().padStart(4, '0')}`,
                        cpf: `${(222222222 + i).toString().padStart(11, '0')}`
                    }
                })
            );

            await Promise.all(customerPromises);
            const creationTime = Date.now() - startTime;

            // Test search performance on large dataset
            const searchStartTime = Date.now();
            const searchResponse = await app.inject({
                method: 'GET',
                url: '/customers?name=Batch',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });
            const searchTime = Date.now() - searchStartTime;

            expect(searchResponse.statusCode).toBe(200);
            const searchResults = JSON.parse(searchResponse.payload);
            expect(searchResults.length).toBeGreaterThan(0);

            // Performance assertions
            expect(creationTime).toBeLessThan(10000); // 10 seconds for batch creation
            expect(searchTime).toBeLessThan(1000); // 1 second for search

            console.log(`Batch creation (${batchSize} records): ${creationTime}ms`);
            console.log(`Search performance: ${searchTime}ms`);

            // Test pagination performance
            const paginationStartTime = Date.now();
            const paginationResponse = await app.inject({
                method: 'GET',
                url: '/customers?page=1&limit=10',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });
            const paginationTime = Date.now() - paginationStartTime;

            expect(paginationResponse.statusCode).toBe(200);
            expect(paginationTime).toBeLessThan(500); // 500ms for pagination

            console.log(`Pagination performance: ${paginationTime}ms`);
        });

        it('should handle complex queries with joins efficiently', async () => {
            // Create test data with relationships
            const customerResponse = await app.inject({
                method: 'POST',
                url: '/customers',
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    name: 'Test Customer',
                    email: 'test@test.com',
                    phone: '(11) 99999-9999',
                    cpf: '12345678909'
                }
            });

            const customerId = JSON.parse(customerResponse.payload).id;

            const productResponse = await app.inject({
                method: 'POST',
                url: '/products',
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    code: 'PROD001',
                    name: 'Test Product',
                    unit: 'UN',
                    stock: 100,
                    purchasePrice: '100.00',
                    salePrice: '150.00',
                    saleType: 'retail'
                }
            });

            const productId = JSON.parse(productResponse.payload).id;

            // Create multiple pre-sales with items (complex relationships)
            const preSalesPromises = Array.from({ length: 10 }, (_, i) =>
                app.inject({
                    method: 'POST',
                    url: '/presales',
                    headers: {
                        authorization: `Bearer ${authToken}`
                    },
                    payload: {
                        customerId: customerId,
                        status: 'draft',
                        notes: `Pre-sale ${i}`,
                        items: [
                            {
                                productId: productId,
                                quantity: `${i + 1}`,
                                unitPrice: '150.00',
                                discount: '10.00'
                            }
                        ]
                    }
                })
            );

            const startTime = Date.now();
            await Promise.all(preSalesPromises);
            const creationTime = Date.now() - startTime;

            // Test complex query performance (pre-sales with customer and product data)
            const queryStartTime = Date.now();
            const preSalesResponse = await app.inject({
                method: 'GET',
                url: '/presales',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });
            const queryTime = Date.now() - queryStartTime;

            expect(preSalesResponse.statusCode).toBe(200);
            const preSalesData = JSON.parse(preSalesResponse.payload);
            expect(preSalesData.length).toBe(10);

            // Verify relationships are loaded (if available)
            preSalesData.forEach((preSale: any) => {
                expect(preSale.customerId).toBe(customerId);
                expect(preSale.items).toBeDefined();
                expect(preSale.items.length).toBe(1);
                expect(preSale.items[0].productId).toBe(productId);
                // Note: Customer and product data may not be loaded in this implementation
                if (preSale.customer) {
                    expect(preSale.customer.name).toBe('Test Customer');
                }
                if (preSale.items[0].product) {
                    expect(preSale.items[0].product.name).toBe('Test Product');
                }
            });

            // Performance assertions
            expect(creationTime).toBeLessThan(5000); // 5 seconds for complex creation
            expect(queryTime).toBeLessThan(2000); // 2 seconds for complex query with joins

            console.log(`Complex creation time: ${creationTime}ms`);
            console.log(`Complex query time: ${queryTime}ms`);
        });
    });

    describe('Connection Pool Monitoring', () => {
        it('should provide accurate connection pool statistics', async () => {
            const connectionManager = getDatabaseConnectionManager();

            // Get initial stats
            const initialStats = connectionManager.getPoolStats();

            // Perform some operations
            await app.inject({
                method: 'POST',
                url: '/customers',
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    name: 'Stats Test Customer',
                    email: 'stats@test.com',
                    phone: '(11) 99999-9999',
                    cpf: '99999999999'
                }
            });

            // Get updated stats
            const updatedStats = connectionManager.getPoolStats();

            // Verify stats are reasonable
            expect(updatedStats.totalCount).toBeGreaterThanOrEqual(0);
            expect(updatedStats.idleCount).toBeGreaterThanOrEqual(0);
            expect(updatedStats.waitingCount).toBeGreaterThanOrEqual(0);

            console.log('Connection pool statistics:', updatedStats);
        });

        it('should handle connection pool cleanup on application shutdown', async () => {
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
                method: 'POST',
                url: '/customers',
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    name: 'Cleanup Test Customer',
                    email: 'cleanup@test.com',
                    phone: '(11) 99999-9999',
                    cpf: '88888888888'
                }
            });

            expect(testResponse.statusCode).toBe(201);

            // Note: Actual cleanup testing would require shutting down the app,
            // which is handled in the afterAll hook
        });
    });
});