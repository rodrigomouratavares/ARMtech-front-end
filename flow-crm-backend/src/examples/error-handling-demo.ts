/**
 * Demonstration of enhanced error handling for product code generation
 * This script shows how the system handles various edge cases gracefully
 */

import { productCodeGenerator, CodeGenerationError } from '../services/product-code-generator.service';
import { productService } from '../services/products.service';
import { db } from '../db/connection';
import { products } from '../db/schema/products';
import { sql } from 'drizzle-orm';

async function demonstrateErrorHandling() {
    console.log('🔧 Product Code Generation Error Handling Demo\n');

    try {
        // 1. Test system health monitoring
        console.log('1. Checking system health...');
        const health = await productCodeGenerator.getSystemHealth();
        console.log(`   Status: ${health.status}`);
        console.log(`   Errors: ${health.errors.length}`);
        console.log(`   Warnings: ${health.warnings.length}`);
        if (health.sequenceInfo) {
            console.log(`   Next sequence: ${health.sequenceInfo.nextSequence}`);
            console.log(`   Has existing products: ${health.sequenceInfo.hasExistingProducts}`);
        }
        console.log('');

        // 2. Test code generation with non-standard codes
        console.log('2. Testing with non-standard product codes...');

        // Insert some non-standard codes
        const nonStandardCodes = [
            { code: 'LEGACY001', name: 'Legacy Product 1' },
            { code: 'CUSTOM_ABC', name: 'Custom Product' },
            { code: 'PROD123', name: 'Short PROD Code' }, // Invalid format
        ];

        for (const product of nonStandardCodes) {
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

        // Generate a new code - should work despite non-standard codes
        const newCode = await productCodeGenerator.generateNextCode();
        console.log(`   Generated code: ${newCode} (ignoring non-standard codes)`);
        console.log('');

        // 3. Test service integration error handling
        console.log('3. Testing service integration error handling...');

        try {
            const product = await productService.create({
                name: 'Test Product with Auto Code',
                unit: 'piece',
                stock: 10,
                purchasePrice: '5.00',
                salePrice: '8.00',
                saleType: 'retail'
                // No code provided - should generate automatically
            });
            console.log(`   Created product with auto-generated code: ${product.code}`);
        } catch (error) {
            if (error instanceof CodeGenerationError) {
                console.log(`   Code generation error: ${error.code} - ${error.message}`);
                if (error.details) {
                    console.log(`   Details:`, error.details);
                }
            } else {
                console.log(`   Other error: ${(error as Error).message}`);
            }
        }
        console.log('');

        // 4. Test code generation test function
        console.log('4. Testing code generation validation...');
        const testResult = await productCodeGenerator.testCodeGeneration();
        console.log(`   Code generation test: ${testResult ? 'PASS' : 'FAIL'}`);
        console.log('');

        // 5. Demonstrate error types
        console.log('5. Error type detection examples...');

        const testErrors = [
            new Error('connection refused'),
            new Error('ECONNRESET'),
            { code: '08006', message: 'connection_failure' },
            new Error('Service temporarily unavailable'),
            new Error('timeout occurred'),
        ];

        for (const error of testErrors) {
            const isConnection = productCodeGenerator['isDatabaseConnectionError'](error);
            const isDatabase = productCodeGenerator['isDatabaseError'](error);
            const isServiceUnavailable = productCodeGenerator['isServiceUnavailableError'](error);

            console.log(`   Error: "${error.message || error}"`);
            console.log(`     Connection error: ${isConnection}`);
            console.log(`     Database error: ${isDatabase}`);
            console.log(`     Service unavailable: ${isServiceUnavailable}`);
        }
        console.log('');

        console.log('✅ Error handling demonstration completed successfully!');

    } catch (error) {
        console.error('❌ Demo failed:', error);
    } finally {
        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await db.delete(products).where(sql`${products.code} LIKE 'LEGACY%'`);
        await db.delete(products).where(sql`${products.code} LIKE 'CUSTOM%'`);
        await db.delete(products).where(sql`${products.code} = 'PROD123'`);
        await db.delete(products).where(sql`${products.name} LIKE 'Test Product%'`);
        console.log('Clean up completed.');
    }
}

// Run the demo if this file is executed directly
if (require.main === module) {
    demonstrateErrorHandling()
        .then(() => {
            console.log('\nDemo finished.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Demo failed:', error);
            process.exit(1);
        });
}

export { demonstrateErrorHandling };