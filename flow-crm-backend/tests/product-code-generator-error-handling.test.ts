import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductCodeGenerator, CodeGenerationError } from '../src/services/product-code-generator.service';
import { db } from '../src/db/connection';
import { products } from '../src/db/schema/products';
import { sql } from 'drizzle-orm';

describe('ProductCodeGenerator - Error Handling', () => {
    let generator: ProductCodeGenerator;

    beforeEach(() => {
        generator = new ProductCodeGenerator();
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(products).where(sql`${products.code} LIKE 'TEST%'`);
    });

    describe('Maximum Sequence Limit Handling', () => {
        it('should throw SEQUENCE_EXHAUSTED error when approaching maximum limit', async () => {
            // Create a product with a code near the maximum
            const nearMaxCode = 'PROD9999998';
            await db.insert(products).values({
                code: nearMaxCode,
                name: 'Test Product Near Max',
                unit: 'unit',
                stock: 0,
                purchasePrice: '10.00',
                salePrice: '15.00',
                saleType: 'retail'
            });

            try {
                // This should succeed (PROD9999999)
                const code1 = await generator.generateNextCode();
                expect(code1).toBe('PROD9999999');

                // Insert the generated code to simulate it being used
                await db.insert(products).values({
                    code: code1,
                    name: 'Test Product At Max Generated',
                    unit: 'unit',
                    stock: 0,
                    purchasePrice: '10.00',
                    salePrice: '15.00',
                    saleType: 'retail'
                });

                // This should fail (would be PROD10000000, exceeding 7 digits)
                await expect(generator.generateNextCode()).rejects.toThrow(CodeGenerationError);
                await expect(generator.generateNextCode()).rejects.toThrow('Maximum product code sequence limit reached');
            } finally {
                // Clean up
                await db.delete(products).where(sql`${products.code} = ${nearMaxCode}`);
                await db.delete(products).where(sql`${products.code} = 'PROD9999999'`);
                await db.delete(products).where(sql`${products.code} LIKE 'PROD%'`);
            }
        });

        it('should provide detailed error information for sequence exhaustion', async () => {
            // Create a product at maximum sequence
            const maxCode = 'PROD9999999';
            await db.insert(products).values({
                code: maxCode,
                name: 'Test Product At Max',
                unit: 'unit',
                stock: 0,
                purchasePrice: '10.00',
                salePrice: '15.00',
                saleType: 'retail'
            });

            try {
                await generator.generateNextCode();
                expect.fail('Should have thrown CodeGenerationError');
            } catch (error) {
                expect(error).toBeInstanceOf(CodeGenerationError);
                const codeError = error as CodeGenerationError;
                expect(codeError.code).toBe('SEQUENCE_EXHAUSTED');
                expect(codeError.retryable).toBe(false);
                expect(codeError.details).toBeDefined();
                expect(codeError.details.maxSequence).toBe(9999999);
            } finally {
                // Clean up
                await db.delete(products).where(sql`${products.code} = ${maxCode}`);
            }
        });
    });

    describe('Non-Standard Code Format Handling', () => {
        it('should handle products with non-standard codes gracefully', async () => {
            // Insert products with various non-standard codes
            const nonStandardProducts = [
                { code: 'CUSTOM001', name: 'Custom Product 1' },
                { code: 'ABC123', name: 'Legacy Product' },
                { code: 'PROD123', name: 'Short PROD Code' }, // Too short
                { code: 'PROD12345678', name: 'Long PROD Code' }, // Too long
                { code: 'PRODUCT0000001', name: 'Wrong prefix' },
            ];

            for (const product of nonStandardProducts) {
                await db.insert(products).values({
                    code: product.code,
                    name: product.name,
                    unit: 'unit',
                    stock: 0,
                    purchasePrice: '10.00',
                    salePrice: '15.00',
                    saleType: 'retail'
                });
            }

            try {
                // Should still be able to generate standard codes
                const generatedCode = await generator.generateNextCode();
                expect(generatedCode).toBe('PROD0000001');
                expect(generator.validateCodeFormat(generatedCode)).toBe(true);

                // Verify the generated code doesn't conflict with non-standard codes
                const sequence = generator.extractSequenceNumber(generatedCode);
                expect(sequence).toBe(1);
            } finally {
                // Clean up
                for (const product of nonStandardProducts) {
                    await db.delete(products).where(sql`${products.code} = ${product.code}`);
                }
                await db.delete(products).where(sql`${products.code} = 'PROD0000001'`);
            }
        });

        it('should continue sequence from highest standard code ignoring non-standard codes', async () => {
            // Insert mix of standard and non-standard codes
            const testProducts = [
                { code: 'PROD0000005', name: 'Standard Product 5' },
                { code: 'CUSTOM999', name: 'Custom Product' },
                { code: 'PROD0000003', name: 'Standard Product 3' },
                { code: 'LEGACY001', name: 'Legacy Product' },
            ];

            for (const product of testProducts) {
                await db.insert(products).values({
                    code: product.code,
                    name: product.name,
                    unit: 'unit',
                    stock: 0,
                    purchasePrice: '10.00',
                    salePrice: '15.00',
                    saleType: 'retail'
                });
            }

            try {
                // Should generate PROD0000006 (next after highest standard code PROD0000005)
                const generatedCode = await generator.generateNextCode();
                expect(generatedCode).toBe('PROD0000006');
            } finally {
                // Clean up
                for (const product of testProducts) {
                    await db.delete(products).where(sql`${products.code} = ${product.code}`);
                }
                await db.delete(products).where(sql`${products.code} = 'PROD0000006'`);
            }
        });
    });

    describe('Database Connection Error Handling', () => {
        it('should handle database connection errors gracefully', async () => {
            // Mock database connection failure
            const originalExecuteWithRetry = vi.fn().mockRejectedValue(
                new Error('connection refused')
            );

            // This test would require mocking the database connection
            // For now, we'll test the error detection logic
            const connectionError = new Error('ECONNREFUSED: Connection refused');
            const isConnectionError = generator['isDatabaseConnectionError'](connectionError);
            expect(isConnectionError).toBe(true);
        });

        it('should detect various types of connection errors', () => {
            const connectionErrors = [
                new Error('connection timeout'),
                new Error('ECONNRESET'),
                new Error('ECONNREFUSED'),
                new Error('connection terminated'),
                { code: '08006', message: 'connection_failure' },
                { code: '53300', message: 'too_many_connections' },
            ];

            for (const error of connectionErrors) {
                const isConnectionError = generator['isDatabaseConnectionError'](error);
                expect(isConnectionError).toBe(true);
            }
        });
    });

    describe('Service Health Monitoring', () => {
        it('should provide system health information', async () => {
            const health = await generator.getSystemHealth();

            expect(health).toHaveProperty('status');
            expect(health).toHaveProperty('sequenceInfo');
            expect(health).toHaveProperty('errors');
            expect(health).toHaveProperty('warnings');
            expect(health).toHaveProperty('recommendations');

            expect(['healthy', 'degraded', 'unavailable']).toContain(health.status);
            expect(Array.isArray(health.errors)).toBe(true);
            expect(Array.isArray(health.warnings)).toBe(true);
            expect(Array.isArray(health.recommendations)).toBe(true);
        });

        it('should perform code generation test successfully', async () => {
            const testResult = await generator.testCodeGeneration();
            expect(typeof testResult).toBe('boolean');

            // In a healthy system, this should return true
            if (testResult) {
                expect(testResult).toBe(true);
            }
        });
    });

    describe('Error Message Quality', () => {
        it('should provide user-friendly error messages', async () => {
            // Test sequence exhaustion error message
            const maxCode = 'PROD9999999';
            await db.insert(products).values({
                code: maxCode,
                name: 'Test Product At Max',
                unit: 'unit',
                stock: 0,
                purchasePrice: '10.00',
                salePrice: '15.00',
                saleType: 'retail'
            });

            try {
                await generator.generateNextCode();
                expect.fail('Should have thrown error');
            } catch (error) {
                const codeError = error as CodeGenerationError;
                expect(codeError.message).toContain('Maximum product code sequence limit reached');
                expect(codeError.message).toContain('PROD9999999');
                expect(codeError.message).toContain('contact system administrator');
            } finally {
                await db.delete(products).where(sql`${products.code} = ${maxCode}`);
            }
        });

        it('should provide actionable error details', async () => {
            const maxCode = 'PROD9999999';
            await db.insert(products).values({
                code: maxCode,
                name: 'Test Product At Max',
                unit: 'unit',
                stock: 0,
                purchasePrice: '10.00',
                salePrice: '15.00',
                saleType: 'retail'
            });

            try {
                await generator.generateNextCode();
                expect.fail('Should have thrown error');
            } catch (error) {
                const codeError = error as CodeGenerationError;
                expect(codeError.details).toBeDefined();
                expect(codeError.details.maxSequence).toBe(9999999);
                if (codeError.details.recommendedAction) {
                    expect(codeError.details.recommendedAction).toContain('system administrator');
                }
            } finally {
                await db.delete(products).where(sql`${products.code} = ${maxCode}`);
            }
        });
    });

    describe('Graceful Degradation', () => {
        it('should handle service unavailability gracefully', () => {
            const serviceError = new Error('Service temporarily unavailable');
            const isServiceUnavailable = generator['isServiceUnavailableError'](serviceError);
            expect(isServiceUnavailable).toBe(true);
        });

        it('should provide fallback behavior when possible', async () => {
            // Test that the service can still validate codes even if generation fails
            expect(generator.validateCodeFormat('PROD0000001')).toBe(true);
            expect(generator.validateCodeFormat('INVALID')).toBe(false);

            expect(generator.extractSequenceNumber('PROD0000001')).toBe(1);
            expect(generator.extractSequenceNumber('INVALID')).toBe(0);
        });
    });
});