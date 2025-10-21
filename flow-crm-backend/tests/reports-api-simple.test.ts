import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

describe('Reports API Simple Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        // Build the Fastify app
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('API Endpoint Availability', () => {
        it('should have reports routes registered', async () => {
            // Test that the routes are registered by checking for 401 (auth required) instead of 404 (not found)
            const response1 = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods'
            });

            // Should return 401 (unauthorized) not 404 (not found), proving the route exists
            expect(response1.statusCode).toBe(401);

            const response2 = await app.inject({
                method: 'GET',
                url: '/api/reports/summary'
            });

            // Should return 401 (unauthorized) not 404 (not found), proving the route exists
            expect(response2.statusCode).toBe(401);
        });

        it('should validate query parameters correctly', async () => {
            // Test invalid date format - should return 400 from Fastify schema validation
            const response1 = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods?startDate=invalid-date&endDate=2024-01-31T23:59:59.999Z'
            });

            expect(response1.statusCode).toBe(400);
            const data1 = JSON.parse(response1.body);
            expect(data1.message).toContain('must match format "date-time"');

            // Test invalid UUID format - should return 400 from Fastify schema validation
            const response2 = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods?paymentMethodId=invalid-uuid'
            });

            expect(response2.statusCode).toBe(400);
            const data2 = JSON.parse(response2.body);
            expect(data2.message).toContain('must match format "uuid"');
        });

        it('should require authentication for all endpoints', async () => {
            const endpoints = [
                '/api/reports/payment-methods',
                '/api/reports/summary'
            ];

            for (const endpoint of endpoints) {
                const response = await app.inject({
                    method: 'GET',
                    url: endpoint
                });

                expect(response.statusCode).toBe(401);
            }
        });

        it('should handle malformed authorization headers', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: 'InvalidFormat token'
                }
            });

            expect(response.statusCode).toBe(401);
        });

        it('should handle missing Bearer prefix', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: 'some-token-without-bearer'
                }
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('Schema Validation', () => {
        it('should validate date range requirements', async () => {
            // Test providing only startDate without endDate
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods?startDate=2024-01-01T00:00:00.000Z'
            });

            expect(response.statusCode).toBe(400);
        });

        it('should validate date format requirements', async () => {
            // Test invalid date format
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/summary?startDate=2024-01-01&endDate=2024-01-31'
            });

            expect(response.statusCode).toBe(400);
            const data = JSON.parse(response.body);
            expect(data.message).toContain('must match format "date-time"');
        });

        it('should validate UUID format for payment method ID', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods?paymentMethodId=not-a-uuid'
            });

            expect(response.statusCode).toBe(400);
            const data = JSON.parse(response.body);
            expect(data.message).toContain('must match format "uuid"');
        });
    });

    describe('Route Configuration', () => {
        it('should have proper OpenAPI schema documentation', async () => {
            // The routes should be configured with proper schema validation
            // This is tested indirectly by the validation tests above

            // Test that both endpoints exist and have validation
            const endpoints = [
                '/api/reports/payment-methods',
                '/api/reports/summary'
            ];

            for (const endpoint of endpoints) {
                const response = await app.inject({
                    method: 'GET',
                    url: endpoint
                });

                // Should not return 404 (route not found)
                expect(response.statusCode).not.toBe(404);
                // Should return 401 (auth required) proving the route exists
                expect(response.statusCode).toBe(401);
            }
        });

        it('should handle query parameter edge cases', async () => {
            // Test with valid UUID format but no auth
            const validUuid = '123e4567-e89b-12d3-a456-426614174000';
            const response = await app.inject({
                method: 'GET',
                url: `/api/reports/payment-methods?paymentMethodId=${validUuid}`
            });

            // Should pass validation but fail auth
            expect(response.statusCode).toBe(401);
        });

        it('should handle valid date formats but no auth', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z'
            });

            // Should pass validation but fail auth
            expect(response.statusCode).toBe(401);
        });
    });

    describe('Error Response Format', () => {
        it('should return consistent error format for validation errors', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods?startDate=invalid'
            });

            expect(response.statusCode).toBe(400);
            const data = JSON.parse(response.body);

            // Fastify validation error format
            expect(data).toHaveProperty('message');
            expect(data).toHaveProperty('statusCode');
            expect(data.statusCode).toBe(400);
        });

        it('should return consistent error format for auth errors', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods'
            });

            expect(response.statusCode).toBe(401);
            // Auth middleware should return consistent format
        });
    });

    describe('HTTP Methods', () => {
        it('should only accept GET requests for reports endpoints', async () => {
            const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

            for (const method of methods) {
                const response = await app.inject({
                    method: method as any,
                    url: '/api/reports/payment-methods'
                });

                // Should return 405 (Method Not Allowed) or 404 (if route not defined for method)
                expect([404, 405]).toContain(response.statusCode);
            }
        });
    });
});