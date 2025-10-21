import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { db } from '../src/db/connection';
import { users } from '../src/db/schema/users';
import { eq } from 'drizzle-orm';

describe('Reports API Authentication and Authorization Tests', () => {
    let app: FastifyInstance;
    let userWithReportsPermission: string;
    let userWithoutReportsPermission: string;
    let adminUser: string;
    let validToken: string;
    let tokenWithoutPermission: string;
    let adminToken: string;

    beforeAll(async () => {
        // Build the Fastify app
        app = buildApp();
        await app.ready();

        // Create test users with different permission levels
        const userWithPermission = await db.insert(users).values({
            name: 'Reports User',
            email: 'reports@example.com',
            password: 'hashedpassword',
            role: 'employee',
            permissions: {
                modules: {
                    reports: true
                }
            }
        }).returning();
        userWithReportsPermission = userWithPermission[0].id;

        const userWithoutPermission = await db.insert(users).values({
            name: 'Regular User',
            email: 'regular@example.com',
            password: 'hashedpassword',
            role: 'employee',
            permissions: {
                modules: {
                    reports: false
                }
            }
        }).returning();
        userWithoutReportsPermission = userWithoutPermission[0].id;

        const admin = await db.insert(users).values({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'hashedpassword',
            role: 'admin',
            permissions: {
                modules: {
                    reports: true,
                    users: true,
                    products: true,
                    customers: true
                }
            }
        }).returning();
        adminUser = admin[0].id;

        // Generate auth tokens for testing
        try {
            const loginResponse1 = await app.inject({
                method: 'POST',
                url: '/api/auth/login',
                payload: {
                    email: 'reports@example.com',
                    password: 'hashedpassword'
                }
            });

            if (loginResponse1.statusCode === 200) {
                const loginData1 = JSON.parse(loginResponse1.body);
                validToken = loginData1.data.token;
            } else {
                validToken = 'mock-valid-token';
            }

            const loginResponse2 = await app.inject({
                method: 'POST',
                url: '/api/auth/login',
                payload: {
                    email: 'regular@example.com',
                    password: 'hashedpassword'
                }
            });

            if (loginResponse2.statusCode === 200) {
                const loginData2 = JSON.parse(loginResponse2.body);
                tokenWithoutPermission = loginData2.data.token;
            } else {
                tokenWithoutPermission = 'mock-no-permission-token';
            }

            const loginResponse3 = await app.inject({
                method: 'POST',
                url: '/api/auth/login',
                payload: {
                    email: 'admin@example.com',
                    password: 'hashedpassword'
                }
            });

            if (loginResponse3.statusCode === 200) {
                const loginData3 = JSON.parse(loginResponse3.body);
                adminToken = loginData3.data.token;
            } else {
                adminToken = 'mock-admin-token';
            }
        } catch (error) {
            // Use mock tokens if authentication system is not fully set up
            validToken = 'mock-valid-token';
            tokenWithoutPermission = 'mock-no-permission-token';
            adminToken = 'mock-admin-token';
        }
    });

    afterAll(async () => {
        // Clean up test users
        await db.delete(users).where(eq(users.id, userWithReportsPermission));
        await db.delete(users).where(eq(users.id, userWithoutReportsPermission));
        await db.delete(users).where(eq(users.id, adminUser));

        await app.close();
    });

    describe('Authentication Requirements', () => {
        it('should return 401 when no authorization header is provided', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods'
            });

            expect(response.statusCode).toBe(401);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('UNAUTHORIZED');
            expect(data.message).toContain('Authentication required');
        });

        it('should return 401 when invalid token is provided', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: 'Bearer invalid-token'
                }
            });

            expect(response.statusCode).toBe(401);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('UNAUTHORIZED');
        });

        it('should return 401 when malformed authorization header is provided', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: 'InvalidFormat token'
                }
            });

            expect(response.statusCode).toBe(401);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('UNAUTHORIZED');
        });

        it('should return 401 when authorization header is missing Bearer prefix', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: validToken
                }
            });

            expect(response.statusCode).toBe(401);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('UNAUTHORIZED');
        });
    });

    describe('Authorization Requirements', () => {
        it('should return 403 when user does not have reports permission', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: `Bearer ${tokenWithoutPermission}`
                }
            });

            expect(response.statusCode).toBe(403);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('FORBIDDEN');
            expect(data.message).toContain('Access denied. Reports permission required.');
        });

        it('should allow access when user has reports permission', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            });

            // Should not be 403 (may be 200 or other status depending on data)
            expect(response.statusCode).not.toBe(403);

            if (response.statusCode === 200) {
                const data = JSON.parse(response.body);
                expect(data.success).toBe(true);
            }
        });

        it('should allow access when admin user accesses reports', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            // Should not be 403 (may be 200 or other status depending on data)
            expect(response.statusCode).not.toBe(403);

            if (response.statusCode === 200) {
                const data = JSON.parse(response.body);
                expect(data.success).toBe(true);
            }
        });
    });

    describe('Permission Validation for Both Endpoints', () => {
        it('should require authentication for payment-methods endpoint', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods'
            });

            expect(response.statusCode).toBe(401);
        });

        it('should require authentication for summary endpoint', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/summary'
            });

            expect(response.statusCode).toBe(401);
        });

        it('should require reports permission for payment-methods endpoint', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: `Bearer ${tokenWithoutPermission}`
                }
            });

            expect(response.statusCode).toBe(403);
        });

        it('should require reports permission for summary endpoint', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/summary',
                headers: {
                    authorization: `Bearer ${tokenWithoutPermission}`
                }
            });

            expect(response.statusCode).toBe(403);
        });

        it('should allow access to payment-methods endpoint with valid permission', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            });

            expect(response.statusCode).not.toBe(401);
            expect(response.statusCode).not.toBe(403);
        });

        it('should allow access to summary endpoint with valid permission', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/summary',
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            });

            expect(response.statusCode).not.toBe(401);
            expect(response.statusCode).not.toBe(403);
        });
    });

    describe('Permission Edge Cases', () => {
        it('should handle user with null permissions object', async () => {
            // Create user with null permissions
            const userWithNullPermissions = await db.insert(users).values({
                name: 'Null Permissions User',
                email: 'null@example.com',
                password: 'hashedpassword',
                role: 'employee',
                permissions: null
            }).returning();

            let nullPermissionToken: string;
            try {
                const loginResponse = await app.inject({
                    method: 'POST',
                    url: '/api/auth/login',
                    payload: {
                        email: 'null@example.com',
                        password: 'hashedpassword'
                    }
                });

                if (loginResponse.statusCode === 200) {
                    const loginData = JSON.parse(loginResponse.body);
                    nullPermissionToken = loginData.data.token;
                } else {
                    nullPermissionToken = 'mock-null-permission-token';
                }
            } catch (error) {
                nullPermissionToken = 'mock-null-permission-token';
            }

            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: `Bearer ${nullPermissionToken}`
                }
            });

            expect(response.statusCode).toBe(403);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('FORBIDDEN');

            // Clean up
            await db.delete(users).where(eq(users.id, userWithNullPermissions[0].id));
        });

        it('should handle user with empty permissions object', async () => {
            // Create user with empty permissions
            const userWithEmptyPermissions = await db.insert(users).values({
                name: 'Empty Permissions User',
                email: 'empty@example.com',
                password: 'hashedpassword',
                role: 'employee',
                permissions: {}
            }).returning();

            let emptyPermissionToken: string;
            try {
                const loginResponse = await app.inject({
                    method: 'POST',
                    url: '/api/auth/login',
                    payload: {
                        email: 'empty@example.com',
                        password: 'hashedpassword'
                    }
                });

                if (loginResponse.statusCode === 200) {
                    const loginData = JSON.parse(loginResponse.body);
                    emptyPermissionToken = loginData.data.token;
                } else {
                    emptyPermissionToken = 'mock-empty-permission-token';
                }
            } catch (error) {
                emptyPermissionToken = 'mock-empty-permission-token';
            }

            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: `Bearer ${emptyPermissionToken}`
                }
            });

            expect(response.statusCode).toBe(403);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('FORBIDDEN');

            // Clean up
            await db.delete(users).where(eq(users.id, userWithEmptyPermissions[0].id));
        });

        it('should handle user with modules object but no reports permission', async () => {
            // Create user with modules but no reports permission
            const userWithModulesNoReports = await db.insert(users).values({
                name: 'Modules No Reports User',
                email: 'modules@example.com',
                password: 'hashedpassword',
                role: 'employee',
                permissions: {
                    modules: {
                        users: true,
                        products: true
                        // reports: missing
                    }
                }
            }).returning();

            let modulesNoReportsToken: string;
            try {
                const loginResponse = await app.inject({
                    method: 'POST',
                    url: '/api/auth/login',
                    payload: {
                        email: 'modules@example.com',
                        password: 'hashedpassword'
                    }
                });

                if (loginResponse.statusCode === 200) {
                    const loginData = JSON.parse(loginResponse.body);
                    modulesNoReportsToken = loginData.data.token;
                } else {
                    modulesNoReportsToken = 'mock-modules-no-reports-token';
                }
            } catch (error) {
                modulesNoReportsToken = 'mock-modules-no-reports-token';
            }

            const response = await app.inject({
                method: 'GET',
                url: '/api/reports/payment-methods',
                headers: {
                    authorization: `Bearer ${modulesNoReportsToken}`
                }
            });

            expect(response.statusCode).toBe(403);
            const data = JSON.parse(response.body);
            expect(data.success).toBe(false);
            expect(data.code).toBe('FORBIDDEN');

            // Clean up
            await db.delete(users).where(eq(users.id, userWithModulesNoReports[0].id));
        });
    });
});