import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { db } from '../src/db/connection';
import { products } from '../src/db/schema/products';

describe('API Response Format for Product Creation', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        // Build the app
        app = buildApp();
        await app.ready();

        // Clean up any existing products
        await db.delete(products);
    });

    afterAll(async () => {
        // Clean up
        await db.delete(products);
        await app.close();
    });

    it('should return standardized response format with generated code', async () => {
        const productData = {
            name: 'Test Product for API Response',
            unit: 'piece',
            description: 'Testing API response format',
            stock: 10,
            purchasePrice: '50.00',
            salePrice: '75.00',
            saleType: 'retail'
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/products',
            headers: {
                'authorization': 'Bearer test-token',
                'content-type': 'application/json'
            },
            payload: productData
        });

        expect(response.statusCode).toBe(201);

        const responseBody = JSON.parse(response.body);

        // Verify standardized response format
        expect(responseBody).toHaveProperty('success', true);
        expect(responseBody).toHaveProperty('data');
        expect(responseBody).toHaveProperty('message', 'Product created successfully');
        expect(responseBody).toHaveProperty('timestamp');

        // Verify the product data includes generated code
        const product = responseBody.data;
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('code');
        expect(product).toHaveProperty('name', productData.name);
        expect(product).toHaveProperty('unit', productData.unit);
        expect(product).toHaveProperty('description', productData.description);
        expect(product).toHaveProperty('stock', productData.stock);
        expect(product).toHaveProperty('purchasePrice', productData.purchasePrice);
        expect(product).toHaveProperty('salePrice', productData.salePrice);
        expect(product).toHaveProperty('saleType', productData.saleType);
        expect(product).toHaveProperty('createdAt');
        expect(product).toHaveProperty('updatedAt');

        // Verify the generated code follows the PROD format
        expect(product.code).toMatch(/^PROD\d{7}$/);
        expect(product.code).toBe('PROD0000001'); // First product should get this code

        // Verify timestamp format
        expect(responseBody.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return sequential codes for multiple products', async () => {
        const productData1 = {
            name: 'Second Test Product',
            unit: 'piece',
            purchasePrice: '30.00',
            salePrice: '50.00',
            saleType: 'retail'
        };

        const productData2 = {
            name: 'Third Test Product',
            unit: 'piece',
            purchasePrice: '40.00',
            salePrice: '60.00',
            saleType: 'retail'
        };

        // Create first product
        const response1 = await app.inject({
            method: 'POST',
            url: '/api/products',
            headers: {
                'authorization': 'Bearer test-token',
                'content-type': 'application/json'
            },
            payload: productData1
        });

        // Create second product
        const response2 = await app.inject({
            method: 'POST',
            url: '/api/products',
            headers: {
                'authorization': 'Bearer test-token',
                'content-type': 'application/json'
            },
            payload: productData2
        });

        expect(response1.statusCode).toBe(201);
        expect(response2.statusCode).toBe(201);

        const responseBody1 = JSON.parse(response1.body);
        const responseBody2 = JSON.parse(response2.body);

        // Verify sequential code generation
        expect(responseBody1.data.code).toBe('PROD0000002');
        expect(responseBody2.data.code).toBe('PROD0000003');

        // Verify both responses have the correct format
        expect(responseBody1.success).toBe(true);
        expect(responseBody2.success).toBe(true);
        expect(responseBody1.message).toBe('Product created successfully');
        expect(responseBody2.message).toBe('Product created successfully');
    });

    it('should handle validation errors with standardized error format', async () => {
        const invalidProductData = {
            name: '', // Invalid: empty name
            unit: 'piece',
            purchasePrice: 'invalid', // Invalid: not a number
            salePrice: '50.00',
            saleType: 'retail'
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/products',
            headers: {
                'authorization': 'Bearer test-token',
                'content-type': 'application/json'
            },
            payload: invalidProductData
        });

        expect(response.statusCode).toBe(422);

        const responseBody = JSON.parse(response.body);

        // Verify standardized error response format
        expect(responseBody).toHaveProperty('success', false);
        expect(responseBody).toHaveProperty('error');
        expect(responseBody).toHaveProperty('timestamp');

        // Verify error structure
        expect(responseBody.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(responseBody.error).toHaveProperty('message');
        expect(responseBody.error).toHaveProperty('details');

        // Verify error details contain field-specific information
        expect(Array.isArray(responseBody.error.details)).toBe(true);
        expect(responseBody.error.details.length).toBeGreaterThan(0);
    });

    it('should maintain backward compatibility when code field is provided', async () => {
        const productDataWithCode = {
            code: 'CUSTOM001', // This should be accepted for backward compatibility
            name: 'Product with Manual Code',
            unit: 'piece',
            purchasePrice: '25.00',
            salePrice: '40.00',
            saleType: 'retail'
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/products',
            headers: {
                'authorization': 'Bearer test-token',
                'content-type': 'application/json'
            },
            payload: productDataWithCode
        });

        expect(response.statusCode).toBe(201);

        const responseBody = JSON.parse(response.body);

        // Verify the manual code was accepted (backward compatibility)
        expect(responseBody.data.code).toBe('CUSTOM001');

        // Verify response format is consistent
        expect(responseBody.success).toBe(true);
        expect(responseBody.message).toBe('Product created successfully');
        expect(responseBody.data.name).toBe(productDataWithCode.name);
    });
});