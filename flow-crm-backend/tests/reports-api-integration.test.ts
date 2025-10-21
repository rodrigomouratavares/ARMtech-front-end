import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { db } from '../src/db/connection';
import { paymentMethods } from '../src/db/schema/payment-methods';
import { preSales } from '../src/db/schema/presales';
import { customers } from '../src/db/schema/customers';
import { users } from '../src/db/schema/users';
import { eq } from 'drizzle-orm';

describe('Reports API Integration Tests', () => {
    let app: FastifyInstance;
    let authToken: string;
    let testUserId: string;
    let testCustomerId: string;
    let testPaymentMethodId: string;
    let testPaymentMethod2Id: string;

    beforeAll(async () => {
        // Build the Fastify app
        app = buildApp();
        await app.ready();

        // Create test user with reports permission
        const testUser = await db.insert(users).values({
            name: 'Test User',
            email: 'test@example.com',
            password: 'hashedpassword',
            role: 'employee',
            permissions: {
                modules: {
                    reports: true
                }
            }
        }).returning();
        testUserId = testUser[0].id;

        // Create test customer
        const testCustomer = await db.insert(customers).values({
            name: 'Test Customer',
            email: 'customer@example.com',
            phone: '1234567890',
            cpf: '12345678901'
        }).returning();
        testCustomerId = testCustomer[0].id;

        // Create test payment methods
        const paymentMethod1 = await db.insert(paymentMethods).values({
            code: 'CASH',
            description: 'Dinheiro',
            isActive: true
        }).returning();
        testPaymentMethodId = paymentMethod1[0].id;

        const paymentMethod2 = await db.insert(paymentMethods).values({
            code: 'CREDIT',
            description: 'Cartão de Crédito',
            isActive: true
        }).returning();
        testPaymentMethod2Id = paymentMethod2[0].id;

        // Generate auth token for testing
        const loginResponse = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: {
                email: 'test@example.com',
                password: 'hashedpassword'
            }
        });

        if (loginResponse.statusCode === 200) {
            const loginData = JSON.parse(loginResponse.body);
            authToken = loginData.data.token;
        } else {
            // Mock token for testing if login doesn't work
            authToken = 'mock-jwt-token';
        }
    });

    afterAll(async () => {
        // Clean up test data
        await db.delete(preSales).where(eq(preSales.customerId, testCustomerId));
        await db.delete(customers).where(eq(customers.id, testCustomerId));
        await db.delete(paymentMethods).where(eq(paymentMethods.id, testPaymentMethodId));
        await db.delete(paymentMethods).where(eq(paymentMethods.id, testPaymentMethod2Id));
        await db.delete(users).where(eq(users.id, testUserId));

        await app.close();
    });

    beforeEach(async () => {
        // Clean up presales before each test
        await db.delete(preSales).where(eq(preSales.customerId, testCustomerId));
    });

    describe('GET /api/reports/payment-methods', () => {
        it('should return payment methods report with no data when no presales exist', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(200);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(true);
            expect(data.data).toBeInstanceOf(Array);
            expect(data.message).toBe('Payment methods report generated successfully');

            // Should return payment methods with zero amounts
            const cashMethod = data.data.find((item: any) => item.paymentMethod.code === 'CASH');
            expect(cashMethod).toBeDefined();
            expect(cashMethod.totalAmount).toBe(0);
            expect(cashMethod.salesCount).toBe(0);
            expect(cashMethod.convertedPresalesCount).toBe(0);
            expect(cashMethod.convertedPresalesAmount).toBe(0);
        });

        it('should return payment methods report with aggregated data when presales exist', async () => {
            // Create test presales
            await db.insert(preSales).values([
                {
                    customerId: testCustomerId,
                    paymentMethodId: testPaymentMethodId,
                    status: 'converted',
                    total: '100.50',
                    discount: '0',
                    discountType: 'fixed',
                    discountPercentage: '0'
                },
                {
                    customerId: testCustomerId,
                    paymentMethodId: testPaymentMethodId,
                    status: 'converted',
                    total: '200.75',
                    discount: '0',
                    discountType: 'fixed',
                    discountPercentage: '0'
                },
                {
                    customerId: testCustomerId,
                    paymentMethodId: testPaymentMethod2Id,
                    status: 'converted',
                    total: '150.25',
                    discount: '0',
                    discountType: 'fixed',
                    discountPercentage: '0'
                }
            ]);

            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(200);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(true);
            expect(data.data).toBeInstanceOf(Array);

            // Find cash payment method data
            const cashMethod = data.data.find((item: any) => item.paymentMethod.code === 'CASH');
            expect(cashMethod).toBeDefined();
            expect(cashMethod.totalAmount).toBe(301.25); // 100.50 + 200.75
            expect(cashMethod.salesCount).toBe(2);
            expect(cashMethod.convertedPresalesCount).toBe(2);
            expect(cashMethod.convertedPresalesAmount).toBe(301.25);

            // Find credit payment method data
            const creditMethod = data.data.find((item: any) => item.paymentMethod.code === 'CREDIT');
            expect(creditMethod).toBeDefined();
            expect(creditMethod.totalAmount).toBe(150.25);
            expect(creditMethod.salesCount).toBe(1);
            expect(creditMethod.convertedPresalesCount).toBe(1);
            expect(creditMethod.convertedPresalesAmount).toBe(150.25);
        });

        it('should filter by date range correctly', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Create presale with specific date
            await db.insert(preSales).values({
                customerId: testCustomerId,
                paymentMethodId: testPaymentMethodId,
                status: 'converted',
                total: '100.00',
                discount: '0',
                discountType: 'fixed',
                discountPercentage: '0',
                createdAt: new Date() // Today
            });

            // Test with date range that includes today
            const response = await app.inject({
                method: 'GET',
                url: `/api/reports/payment-methods?startDate=${yesterday.toISOString()}&endDate=${tomorrow.toISOString()}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(200);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(true);

            const cashMethod = data.data.find((item: any) => item.paymentMethod.code === 'CASH');
            expect(cashMethod.totalAmount).toBe(100);
            expect(cashMethod.salesCount).toBe(1);
        });

        it('should filter by payment method ID correctly', async () => {
            // Create presales for both payment methods
            await db.insert(preSales).values([
                {
                    customerId: testCustomerId,
                    paymentMethodId: testPaymentMethodId,
                    status: 'converted',
                    total: '100.00',
                    discount: '0',
                    discountType: 'fixed',
                    discountPercentage: '0'
                },
                {
                    customerId: testCustomerId,
                    paymentMethodId: testPaymentMethod2Id,
                    status: 'converted',
                    total: '200.00',
                    discount: '0',
                    discountType: 'fixed',
                    discountPercentage: '0'
                }
            ]);

            // Filter by specific payment method
            const response = await app.inject({
                method: 'GET',
                url: `/api/reports/payment-methods?paymentMethodId=${testPaymentMethodId}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(200);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(true);

            // Should only return data for the filtered payment method
            const cashMethod = data.data.find((item: any) => item.paymentMethod.code === 'CASH');
            expect(cashMethod).toBeDefined();
            expect(cashMethod.totalAmount).toBe(100);

            // Should not include credit method data
            const creditMethod = data.data.find((item: any) => item.paymentMethod.code === 'CREDIT');
            expect(creditMethod).toBeUndefined();
        });

        it('should return 400 for invalid date format', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods?startDate=invalid-date&endDate=2024-01-31T23:59:59.999Z',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(400);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('INVALID_FILTERS');
            expect(data.message).toContain('Invalid date format');
        });

        it('should return 400 when start date is after end date', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods?startDate=2024-02-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(400);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('INVALID_FILTERS');
            expect(data.message).toContain('Start date must be before or equal to end date');
        });

        it('should return 400 when only one date is provided', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods?startDate=2024-01-01T00:00:00.000Z',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(400);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('INVALID_FILTERS');
            expect(data.message).toContain('Both startDate and endDate must be provided');
        });

        it('should return 400 for invalid payment method ID format', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods?paymentMethodId=invalid-uuid',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(400);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('INVALID_FILTERS');
            expect(data.message).toContain('Invalid UUID format');
        });

        it('should return 401 when no authentication token is provided', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods'
            });

            expect(response.statusCode).toBe(401);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('UNAUTHORIZED');
        });
    });

    describe('GET /api/reports/summary', () => {
        it('should return report summary with no data when no presales exist', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/summary',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(200);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(true);
            expect(data.data).toBeDefined();
            expect(data.data.totalAmount).toBe(0);
            expect(data.data.totalSalesCount).toBe(0);
            expect(data.data.totalConvertedPresales).toBe(0);
            expect(data.data.totalConvertedPresalesAmount).toBe(0);
            expect(data.data.period).toBeDefined();
            expect(data.data.period.startDate).toBeDefined();
            expect(data.data.period.endDate).toBeDefined();
        });

        it('should return report summary with aggregated totals when presales exist', async () => {
            // Create test presales
            await db.insert(preSales).values([
                {
                    customerId: testCustomerId,
                    paymentMethodId: testPaymentMethodId,
                    status: 'converted',
                    total: '100.50',
                    discount: '0',
                    discountType: 'fixed',
                    discountPercentage: '0'
                },
                {
                    customerId: testCustomerId,
                    paymentMethodId: testPaymentMethod2Id,
                    status: 'converted',
                    total: '200.75',
                    discount: '0',
                    discountType: 'fixed',
                    discountPercentage: '0'
                },
                {
                    customerId: testCustomerId,
                    paymentMethodId: testPaymentMethodId,
                    status: 'converted',
                    total: '150.25',
                    discount: '0',
                    discountType: 'fixed',
                    discountPercentage: '0'
                }
            ]);

            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/summary',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(200);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(true);
            expect(data.data.totalAmount).toBe(451.5); // 100.50 + 200.75 + 150.25
            expect(data.data.totalSalesCount).toBe(3);
            expect(data.data.totalConvertedPresales).toBe(3);
            expect(data.data.totalConvertedPresalesAmount).toBe(451.5);
        });

        it('should filter summary by date range correctly', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Create presale with specific date
            await db.insert(preSales).values({
                customerId: testCustomerId,
                paymentMethodId: testPaymentMethodId,
                status: 'converted',
                total: '100.00',
                discount: '0',
                discountType: 'fixed',
                discountPercentage: '0',
                createdAt: new Date() // Today
            });

            // Test with date range that includes today
            const response = await app.inject({
                method: 'GET',
                url: `/api/reports/summary?startDate=${yesterday.toISOString()}&endDate=${tomorrow.toISOString()}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(200);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(true);
            expect(data.data.totalAmount).toBe(100);
            expect(data.data.totalSalesCount).toBe(1);
            expect(data.data.period.startDate).toBe(yesterday.toISOString());
            expect(data.data.period.endDate).toBe(tomorrow.toISOString());
        });

        it('should filter summary by payment method ID correctly', async () => {
            // Create presales for both payment methods
            await db.insert(preSales).values([
                {
                    customerId: testCustomerId,
                    paymentMethodId: testPaymentMethodId,
                    status: 'converted',
                    total: '100.00',
                    discount: '0',
                    discountType: 'fixed',
                    discountPercentage: '0'
                },
                {
                    customerId: testCustomerId,
                    paymentMethodId: testPaymentMethod2Id,
                    status: 'converted',
                    total: '200.00',
                    discount: '0',
                    discountType: 'fixed',
                    discountPercentage: '0'
                }
            ]);

            // Filter by specific payment method
            const response = await app.inject({
                method: 'GET',
                url: `/api/reports/summary?paymentMethodId=${testPaymentMethodId}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(200);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(true);
            expect(data.data.totalAmount).toBe(100); // Only cash method
            expect(data.data.totalSalesCount).toBe(1);
        });

        it('should return 400 for invalid parameters in summary endpoint', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/summary?startDate=invalid-date',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(400);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('INVALID_FILTERS');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle non-existent payment method ID gracefully', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await app.inject({
                method: 'GET',
                url: `/api/reports/payment-methods?paymentMethodId=${nonExistentId}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(400);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('INVALID_FILTERS');
            expect(data.message).toContain('Payment method not found');
        });

        it('should handle future start date correctly', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 10);

            const evenFutureDate = new Date();
            evenFutureDate.setDate(evenFutureDate.getDate() + 20);

            const response = await app.inject({
                method: 'GET',
                url: `/api/reports/payment-methods?startDate=${futureDate.toISOString()}&endDate=${evenFutureDate.toISOString()}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(400);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('INVALID_FILTERS');
            expect(data.message).toContain('Start date cannot be in the future');
        });

        it('should only include converted presales in calculations', async () => {
            // Create presales with different statuses
            await db.insert(preSales).values([
                {
                    customerId: testCustomerId,
                    paymentMethodId: testPaymentMethodId,
                    status: 'converted',
                    total: '100.00',
                    discount: '0',
                    discountType: 'fixed',
                    discountPercentage: '0'
                },
                {
                    customerId: testCustomerId,
                    paymentMethodId: testPaymentMethodId,
                    status: 'pending',
                    total: '200.00',
                    discount: '0',
                    discountType: 'fixed',
                    discountPercentage: '0'
                },
                {
                    customerId: testCustomerId,
                    paymentMethodId: testPaymentMethodId,
                    status: 'cancelled',
                    total: '300.00',
                    discount: '0',
                    discountType: 'fixed',
                    discountPercentage: '0'
                }
            ]);

            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(200);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(true);

            const cashMethod = data.data.find((item: any) => item.paymentMethod.code === 'CASH');
            expect(cashMethod).toBeDefined();
            expect(cashMethod.totalAmount).toBe(100); // Only converted presale
            expect(cashMethod.salesCount).toBe(1);
        });

        it('should only include active payment methods', async () => {
            // Create inactive payment method
            const inactivePaymentMethod = await db.insert(paymentMethods).values({
                code: 'INACTIVE',
                description: 'Inactive Method',
                isActive: false
            }).returning();

            // Create presale with inactive payment method
            await db.insert(preSales).values({
                customerId: testCustomerId,
                paymentMethodId: inactivePaymentMethod[0].id,
                status: 'converted',
                total: '100.00',
                discount: '0',
                discountType: 'fixed',
                discountPercentage: '0'
            });

            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(response.statusCode).toBe(200);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(true);

            // Should not include inactive payment method
            const inactiveMethod = data.data.find((item: any) => item.paymentMethod.code === 'INACTIVE');
            expect(inactiveMethod).toBeUndefined();

            // Clean up
            await db.delete(paymentMethods).where(eq(paymentMethods.id, inactivePaymentMethod[0].id));
        });
    });
});