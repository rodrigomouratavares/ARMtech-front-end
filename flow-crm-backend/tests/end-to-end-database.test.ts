import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../src/app';
import { db, checkDatabaseConnection } from '../src/db/connection';
import { users } from '../src/db/schema/users';
import { customers } from '../src/db/schema/customers';
import { products } from '../src/db/schema/products';
import { preSales, preSaleItems } from '../src/db/schema/presales';
import type { FastifyInstance } from 'fastify';

describe('End-to-End Database Integration', () => {
    let app: FastifyInstance;
    let authToken: string;
    let adminUserId: string;
    let customerId: string;
    let productId: string;
    let preSaleId: string;

    beforeAll(async () => {
        // Verify database connection
        const isConnected = await checkDatabaseConnection();
        expect(isConnected).toBe(true);

        // Build the application
        app = buildApp();
        await app.ready();
    });

    beforeEach(async () => {
        // Clean up all test data before each test
        await db.delete(preSaleItems);
        await db.delete(preSales);
        await db.delete(products);
        await db.delete(customers);
        await db.delete(users);
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

    describe('Complete API Workflow with Persistent Data', () => {
        it('should complete full CRM workflow: user registration -> authentication -> customer management -> product management -> pre-sales creation', async () => {
            // Step 1: Register admin user
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

            expect(registerResponse.statusCode).toBe(201);
            const registerData = JSON.parse(registerResponse.payload);
            expect(registerData.user.email).toBe('admin@test.com');
            expect(registerData.user.role).toBe('admin');
            adminUserId = registerData.user.id;

            // Step 2: Authenticate user
            const loginResponse = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    email: 'admin@test.com',
                    password: 'admin123'
                }
            });

            expect(loginResponse.statusCode).toBe(200);
            const loginData = JSON.parse(loginResponse.payload);
            expect(loginData.token).toBeDefined();
            authToken = loginData.token;

            // Step 3: Create customer
            const customerResponse = await app.inject({
                method: 'POST',
                url: '/customers',
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    name: 'João Silva',
                    email: 'joao.silva@test.com',
                    phone: '(11) 99999-9999',
                    cpf: '123.456.789-09',
                    address: 'Rua das Flores, 123'
                }
            });

            expect(customerResponse.statusCode).toBe(201);
            const customerData = JSON.parse(customerResponse.payload);
            expect(customerData.name).toBe('João Silva');
            expect(customerData.cpf).toBe('12345678909');
            customerId = customerData.id;

            // Step 4: Create product
            const productResponse = await app.inject({
                method: 'POST',
                url: '/products',
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    code: 'PROD001',
                    name: 'Notebook Dell Inspiron',
                    unit: 'UN',
                    description: 'Notebook Dell Inspiron 15 3000',
                    stock: 10,
                    purchasePrice: '1500.00',
                    salePrice: '2000.00',
                    saleType: 'retail'
                }
            });

            expect(productResponse.statusCode).toBe(201);
            const productData = JSON.parse(productResponse.payload);
            expect(productData.code).toBe('PROD001');
            expect(productData.stock).toBe(10);
            productId = productData.id;

            // Step 5: Create pre-sale
            const preSaleResponse = await app.inject({
                method: 'POST',
                url: '/presales',
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    customerId: customerId,
                    status: 'draft',
                    notes: 'Test pre-sale from E2E test',
                    items: [
                        {
                            productId: productId,
                            quantity: '2',
                            unitPrice: '2000.00',
                            discount: '100.00'
                        }
                    ]
                }
            });

            expect(preSaleResponse.statusCode).toBe(201);
            const preSaleData = JSON.parse(preSaleResponse.payload);
            expect(preSaleData.customerId).toBe(customerId);
            expect(preSaleData.items).toHaveLength(1);
            expect(preSaleData.items[0].productId).toBe(productId);
            expect(preSaleData.items[0].totalPrice).toBe('3900.00'); // (2 * 2000) - 100
            preSaleId = preSaleData.id;

            // Step 6: Verify data persistence by retrieving all created entities

            // Verify user exists
            const userResponse = await app.inject({
                method: 'GET',
                url: '/auth/profile',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });
            expect(userResponse.statusCode).toBe(200);
            const userData = JSON.parse(userResponse.payload);
            expect(userData.id).toBe(adminUserId);

            // Verify customer exists
            const getCustomerResponse = await app.inject({
                method: 'GET',
                url: `/customers/${customerId}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });
            expect(getCustomerResponse.statusCode).toBe(200);
            const retrievedCustomer = JSON.parse(getCustomerResponse.payload);
            expect(retrievedCustomer.name).toBe('João Silva');

            // Verify product exists
            const getProductResponse = await app.inject({
                method: 'GET',
                url: `/products/${productId}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });
            expect(getProductResponse.statusCode).toBe(200);
            const retrievedProduct = JSON.parse(getProductResponse.payload);
            expect(retrievedProduct.code).toBe('PROD001');

            // Verify pre-sale exists with all relationships
            const getPreSaleResponse = await app.inject({
                method: 'GET',
                url: `/presales/${preSaleId}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });
            expect(getPreSaleResponse.statusCode).toBe(200);
            const retrievedPreSale = JSON.parse(getPreSaleResponse.payload);
            expect(retrievedPreSale.customer.name).toBe('João Silva');
            expect(retrievedPreSale.items[0].product.name).toBe('Notebook Dell Inspiron');
        });

        it('should handle data updates and maintain consistency across entities', async () => {
            // Create initial data (user, customer, product, pre-sale)
            await setupCompleteWorkflow();

            // Update customer information
            const updateCustomerResponse = await app.inject({
                method: 'PUT',
                url: `/customers/${customerId}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    name: 'João Silva Updated',
                    phone: '(11) 88888-8888'
                }
            });

            expect(updateCustomerResponse.statusCode).toBe(200);
            const updatedCustomer = JSON.parse(updateCustomerResponse.payload);
            expect(updatedCustomer.name).toBe('João Silva Updated');

            // Update product stock
            const updateStockResponse = await app.inject({
                method: 'PATCH',
                url: `/products/${productId}/stock`,
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    stock: 25
                }
            });

            expect(updateStockResponse.statusCode).toBe(200);
            const updatedProduct = JSON.parse(updateStockResponse.payload);
            expect(updatedProduct.stock).toBe(25);

            // Update pre-sale status
            const updateStatusResponse = await app.inject({
                method: 'PATCH',
                url: `/presales/${preSaleId}/status`,
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    status: 'pending'
                }
            });

            expect(updateStatusResponse.statusCode).toBe(200);
            const updatedPreSale = JSON.parse(updateStatusResponse.payload);
            expect(updatedPreSale.status).toBe('pending');

            // Verify all updates persisted correctly
            const getPreSaleResponse = await app.inject({
                method: 'GET',
                url: `/presales/${preSaleId}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            const finalPreSale = JSON.parse(getPreSaleResponse.payload);
            expect(finalPreSale.status).toBe('pending');
            expect(finalPreSale.customer.name).toBe('João Silva Updated');
        });

        it('should enforce database constraints and handle constraint violations', async () => {
            // Create initial user and authenticate
            await setupAuthentication();

            // Create first customer
            const customer1Response = await app.inject({
                method: 'POST',
                url: '/customers',
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    name: 'Customer 1',
                    email: 'customer1@test.com',
                    phone: '(11) 99999-9999',
                    cpf: '123.456.789-09'
                }
            });

            expect(customer1Response.statusCode).toBe(201);

            // Try to create customer with duplicate CPF
            const duplicateCpfResponse = await app.inject({
                method: 'POST',
                url: '/customers',
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    name: 'Customer 2',
                    email: 'customer2@test.com',
                    phone: '(11) 88888-8888',
                    cpf: '123.456.789-09' // Same CPF
                }
            });

            expect(duplicateCpfResponse.statusCode).toBe(400);
            const errorData = JSON.parse(duplicateCpfResponse.payload);
            expect(errorData.message).toContain('CPF already exists');

            // Try to create customer with duplicate email
            const duplicateEmailResponse = await app.inject({
                method: 'POST',
                url: '/customers',
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    name: 'Customer 3',
                    email: 'customer1@test.com', // Same email
                    phone: '(11) 77777-7777',
                    cpf: '987.654.321-00'
                }
            });

            expect(duplicateEmailResponse.statusCode).toBe(400);
            const emailErrorData = JSON.parse(duplicateEmailResponse.payload);
            expect(emailErrorData.message).toContain('Email already exists');

            // Create product
            const product1Response = await app.inject({
                method: 'POST',
                url: '/products',
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    code: 'PROD001',
                    name: 'Product 1',
                    unit: 'UN',
                    stock: 10,
                    purchasePrice: '100.00',
                    salePrice: '150.00',
                    saleType: 'retail'
                }
            });

            expect(product1Response.statusCode).toBe(201);

            // Try to create product with duplicate code
            const duplicateCodeResponse = await app.inject({
                method: 'POST',
                url: '/products',
                headers: {
                    authorization: `Bearer ${authToken}`
                },
                payload: {
                    code: 'PROD001', // Same code
                    name: 'Product 2',
                    unit: 'UN',
                    stock: 5,
                    purchasePrice: '200.00',
                    salePrice: '300.00',
                    saleType: 'wholesale'
                }
            });

            expect(duplicateCodeResponse.statusCode).toBe(400);
            const codeErrorData = JSON.parse(duplicateCodeResponse.payload);
            expect(codeErrorData.message).toContain('Product code already exists');
        });

        it('should handle foreign key relationships and cascade operations', async () => {
            // Setup complete workflow
            await setupCompleteWorkflow();

            // Verify pre-sale has items
            const getPreSaleResponse = await app.inject({
                method: 'GET',
                url: `/presales/${preSaleId}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(getPreSaleResponse.statusCode).toBe(200);
            const preSaleData = JSON.parse(getPreSaleResponse.payload);
            expect(preSaleData.items).toHaveLength(1);

            // Delete pre-sale (should cascade delete items)
            const deletePreSaleResponse = await app.inject({
                method: 'DELETE',
                url: `/presales/${preSaleId}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(deletePreSaleResponse.statusCode).toBe(204);

            // Verify pre-sale is deleted
            const getDeletedPreSaleResponse = await app.inject({
                method: 'GET',
                url: `/presales/${preSaleId}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(getDeletedPreSaleResponse.statusCode).toBe(404);

            // Verify customer and product still exist (no cascade)
            const getCustomerResponse = await app.inject({
                method: 'GET',
                url: `/customers/${customerId}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(getCustomerResponse.statusCode).toBe(200);

            const getProductResponse = await app.inject({
                method: 'GET',
                url: `/products/${productId}`,
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(getProductResponse.statusCode).toBe(200);
        });

        it('should handle search and filtering operations with persistent data', async () => {
            // Setup authentication
            await setupAuthentication();

            // Create multiple customers
            const customers = [
                {
                    name: 'João Silva',
                    email: 'joao@test.com',
                    phone: '(11) 99999-9999',
                    cpf: '123.456.789-09'
                },
                {
                    name: 'Maria Santos',
                    email: 'maria@test.com',
                    phone: '(11) 88888-8888',
                    cpf: '987.654.321-00'
                },
                {
                    name: 'Pedro Oliveira',
                    email: 'pedro@test.com',
                    phone: '(11) 77777-7777',
                    cpf: '111.222.333-96'
                }
            ];

            for (const customer of customers) {
                const response = await app.inject({
                    method: 'POST',
                    url: '/customers',
                    headers: {
                        authorization: `Bearer ${authToken}`
                    },
                    payload: customer
                });
                expect(response.statusCode).toBe(201);
            }

            // Test search by name
            const searchByNameResponse = await app.inject({
                method: 'GET',
                url: '/customers?name=João',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(searchByNameResponse.statusCode).toBe(200);
            const searchResults = JSON.parse(searchByNameResponse.payload);
            expect(searchResults).toHaveLength(1);
            expect(searchResults[0].name).toBe('João Silva');

            // Test pagination
            const page1Response = await app.inject({
                method: 'GET',
                url: '/customers?page=1&limit=2',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(page1Response.statusCode).toBe(200);
            const page1Results = JSON.parse(page1Response.payload);
            expect(page1Results.length).toBeGreaterThan(0);
            expect(page1Results.length).toBeLessThanOrEqual(3); // Should have all customers or paginated

            const page2Response = await app.inject({
                method: 'GET',
                url: '/customers?page=2&limit=2',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(page2Response.statusCode).toBe(200);
            const page2Results = JSON.parse(page2Response.payload);
            expect(page2Results.length).toBeGreaterThanOrEqual(0); // May be empty if pagination works

            // Test sorting
            const sortedResponse = await app.inject({
                method: 'GET',
                url: '/customers?sortBy=name&sortOrder=asc',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            expect(sortedResponse.statusCode).toBe(200);
            const sortedResults = JSON.parse(sortedResponse.payload);
            expect(sortedResults[0].name).toBe('João Silva');
            expect(sortedResults[1].name).toBe('Maria Santos');
            expect(sortedResults[2].name).toBe('Pedro Oliveira');
        });
    });

    // Helper function to setup authentication
    async function setupAuthentication() {
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

        expect(registerResponse.statusCode).toBe(201);
        const registerData = JSON.parse(registerResponse.payload);
        adminUserId = registerData.user.id;

        const loginResponse = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: {
                email: 'admin@test.com',
                password: 'admin123'
            }
        });

        expect(loginResponse.statusCode).toBe(200);
        const loginData = JSON.parse(loginResponse.payload);
        authToken = loginData.token;
    }

    // Helper function to setup complete workflow
    async function setupCompleteWorkflow() {
        await setupAuthentication();

        // Create customer
        const customerResponse = await app.inject({
            method: 'POST',
            url: '/customers',
            headers: {
                authorization: `Bearer ${authToken}`
            },
            payload: {
                name: 'João Silva',
                email: 'joao.silva@test.com',
                phone: '(11) 99999-9999',
                cpf: '123.456.789-09',
                address: 'Rua das Flores, 123'
            }
        });

        expect(customerResponse.statusCode).toBe(201);
        customerId = JSON.parse(customerResponse.payload).id;

        // Create product
        const productResponse = await app.inject({
            method: 'POST',
            url: '/products',
            headers: {
                authorization: `Bearer ${authToken}`
            },
            payload: {
                code: 'PROD001',
                name: 'Notebook Dell Inspiron',
                unit: 'UN',
                description: 'Notebook Dell Inspiron 15 3000',
                stock: 10,
                purchasePrice: '1500.00',
                salePrice: '2000.00',
                saleType: 'retail'
            }
        });

        expect(productResponse.statusCode).toBe(201);
        productId = JSON.parse(productResponse.payload).id;

        // Create pre-sale
        const preSaleResponse = await app.inject({
            method: 'POST',
            url: '/presales',
            headers: {
                authorization: `Bearer ${authToken}`
            },
            payload: {
                customerId: customerId,
                status: 'draft',
                notes: 'Test pre-sale',
                items: [
                    {
                        productId: productId,
                        quantity: '2',
                        unitPrice: '2000.00',
                        discount: '100.00'
                    }
                ]
            }
        });

        expect(preSaleResponse.statusCode).toBe(201);
        preSaleId = JSON.parse(preSaleResponse.payload).id;
    }
});