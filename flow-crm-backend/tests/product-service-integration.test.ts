import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { productService, CreateProductData, UpdateProductData } from '../src/services/products.service';
import { db, checkDatabaseConnection } from '../src/db/connection';
import { products } from '../src/db/schema/products';

describe('Product Service Database Integration', () => {
    // Test data
    const testProduct1: CreateProductData = {
        code: 'PROD001',
        name: 'Notebook Dell Inspiron',
        unit: 'UN',
        description: 'Notebook Dell Inspiron 15 3000',
        stock: 10,
        purchasePrice: '1500.00',
        salePrice: '2000.00',
        saleType: 'retail'
    };

    const testProduct2: CreateProductData = {
        code: 'PROD002',
        name: 'Mouse Logitech',
        unit: 'UN',
        description: 'Mouse Logitech MX Master 3',
        stock: 25,
        purchasePrice: '200.00',
        salePrice: '300.00',
        saleType: 'wholesale'
    };

    beforeAll(async () => {
        // Verify database connection
        const isConnected = await checkDatabaseConnection();
        expect(isConnected).toBe(true);
    });

    beforeEach(async () => {
        // Clean up test data before each test
        await db.delete(products);
    });

    afterAll(async () => {
        // Clean up test data after all tests
        await db.delete(products);
    });

    describe('CRUD Operations', () => {
        it('should create a product with valid data', async () => {
            const product = await productService.create(testProduct1);

            expect(product).toBeDefined();
            expect(product.id).toBeDefined();
            expect(product.code).toBe(testProduct1.code.toUpperCase());
            expect(product.name).toBe(testProduct1.name);
            expect(product.unit).toBe(testProduct1.unit);
            expect(product.description).toBe(testProduct1.description);
            expect(product.stock).toBe(testProduct1.stock);
            expect(product.purchasePrice).toBe(testProduct1.purchasePrice);
            expect(product.salePrice).toBe(testProduct1.salePrice);
            expect(product.saleType).toBe(testProduct1.saleType);
            expect(product.createdAt).toBeInstanceOf(Date);
            expect(product.updatedAt).toBeInstanceOf(Date);
        });

        it('should retrieve a product by ID', async () => {
            const createdProduct = await productService.create(testProduct1);
            const foundProduct = await productService.findById(createdProduct.id);

            expect(foundProduct).toBeDefined();
            expect(foundProduct!.id).toBe(createdProduct.id);
            expect(foundProduct!.name).toBe(createdProduct.name);
            expect(foundProduct!.code).toBe(createdProduct.code);
        });

        it('should retrieve a product by code', async () => {
            const createdProduct = await productService.create(testProduct1);
            const foundProduct = await productService.findByCode(createdProduct.code);

            expect(foundProduct).toBeDefined();
            expect(foundProduct!.id).toBe(createdProduct.id);
            expect(foundProduct!.code).toBe(createdProduct.code);
        });

        it('should return null when product ID does not exist', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
            const product = await productService.findById(nonExistentId);

            expect(product).toBeNull();
        });

        it('should return null when product code does not exist', async () => {
            const product = await productService.findByCode('NONEXISTENT');

            expect(product).toBeNull();
        });

        it('should update a product with valid data', async () => {
            const createdProduct = await productService.create(testProduct1);

            const updateData: UpdateProductData = {
                name: 'Notebook Dell Inspiron Updated',
                stock: 15,
                salePrice: '2200.00'
            };

            const updatedProduct = await productService.update(createdProduct.id, updateData);

            expect(updatedProduct.name).toBe(updateData.name);
            expect(updatedProduct.stock).toBe(updateData.stock);
            expect(updatedProduct.salePrice).toBe(updateData.salePrice);
            expect(updatedProduct.code).toBe(createdProduct.code); // Should remain unchanged
            expect(updatedProduct.updatedAt.getTime()).toBeGreaterThan(createdProduct.updatedAt.getTime());
        });

        it('should delete a product', async () => {
            const createdProduct = await productService.create(testProduct1);

            await productService.delete(createdProduct.id);

            const deletedProduct = await productService.findById(createdProduct.id);
            expect(deletedProduct).toBeNull();
        });

        it('should throw error when trying to update non-existent product', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

            await expect(
                productService.update(nonExistentId, { name: 'Test' })
            ).rejects.toThrow('Product not found');
        });

        it('should throw error when trying to delete non-existent product', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

            await expect(
                productService.delete(nonExistentId)
            ).rejects.toThrow('Product not found');
        });
    });

    describe('Search and Filtering', () => {
        beforeEach(async () => {
            // Create test products for search tests
            await productService.create(testProduct1);
            await productService.create(testProduct2);
        });

        it('should find all products without filters', async () => {
            const products = await productService.findAll();

            expect(products).toHaveLength(2);
            expect(products.some(p => p.name === testProduct1.name)).toBe(true);
            expect(products.some(p => p.name === testProduct2.name)).toBe(true);
        });

        it('should filter products by code', async () => {
            const products = await productService.findAll({ code: 'PROD001' });

            expect(products).toHaveLength(1);
            expect(products[0].code).toBe(testProduct1.code.toUpperCase());
        });

        it('should filter products by name', async () => {
            const products = await productService.findAll({ name: 'Notebook' });

            expect(products).toHaveLength(1);
            expect(products[0].name).toBe(testProduct1.name);
        });

        it('should filter products by sale type', async () => {
            const products = await productService.findAll({ saleType: 'wholesale' });

            expect(products).toHaveLength(1);
            expect(products[0].saleType).toBe(testProduct2.saleType);
        });

        it('should filter products by stock range', async () => {
            const products = await productService.findAll({ minStock: 20, maxStock: 30 });

            expect(products).toHaveLength(1);
            expect(products[0].stock).toBe(testProduct2.stock);
        });

        it('should perform global search across code, name, and description', async () => {
            const products = await productService.findAll({ search: 'Logitech' });

            expect(products).toHaveLength(1);
            expect(products[0].name).toBe(testProduct2.name);
        });

        it('should support pagination', async () => {
            const page1 = await productService.findAll({ page: 1, limit: 1 });
            const page2 = await productService.findAll({ page: 2, limit: 1 });

            expect(page1).toHaveLength(1);
            expect(page2).toHaveLength(1);
            expect(page1[0].id).not.toBe(page2[0].id);
        });

        it('should support sorting by name', async () => {
            const productsAsc = await productService.findAll({ sortBy: 'name', sortOrder: 'asc' });
            const productsDesc = await productService.findAll({ sortBy: 'name', sortOrder: 'desc' });

            expect(productsAsc[0].name).toBe('Mouse Logitech');
            expect(productsDesc[0].name).toBe('Notebook Dell Inspiron');
        });

        it('should support sorting by stock', async () => {
            const productsAsc = await productService.findAll({ sortBy: 'stock', sortOrder: 'asc' });
            const productsDesc = await productService.findAll({ sortBy: 'stock', sortOrder: 'desc' });

            expect(productsAsc[0].stock).toBe(10);
            expect(productsDesc[0].stock).toBe(25);
        });

        it('should count products with filters', async () => {
            const totalCount = await productService.count();
            const filteredCount = await productService.count({ name: 'Notebook' });

            expect(Number(totalCount)).toBe(2);
            expect(Number(filteredCount)).toBe(1);
        });
    });

    describe('Product Code Uniqueness Constraint', () => {
        it('should enforce product code uniqueness on creation', async () => {
            await productService.create(testProduct1);

            const duplicateProduct = {
                ...testProduct2,
                code: testProduct1.code // Same code
            };

            await expect(
                productService.create(duplicateProduct)
            ).rejects.toThrow('Product code already exists');
        });

        it('should reject any attempts to modify product code after creation', async () => {
            const product = await productService.create(testProduct1);

            await expect(
                productService.update(product.id, { code: 'NEWCODE001' })
            ).rejects.toThrow('Product code cannot be modified after creation');
        });

        it('should reject code modification even with same code', async () => {
            const product = await productService.create(testProduct1);

            await expect(
                productService.update(product.id, { code: testProduct1.code })
            ).rejects.toThrow('Product code cannot be modified after creation');
        });

        it('should allow updating other fields while ignoring code field', async () => {
            const product = await productService.create(testProduct1);

            const updatedProduct = await productService.update(product.id, {
                name: 'Updated Name',
                stock: 20
            });

            expect(updatedProduct.name).toBe('Updated Name');
            expect(updatedProduct.stock).toBe(20);
            expect(updatedProduct.code).toBe(testProduct1.code.toUpperCase()); // Should remain unchanged
        });

        it('should convert product code to uppercase', async () => {
            const productWithLowerCode = {
                ...testProduct1,
                code: 'prod001'
            };

            const product = await productService.create(productWithLowerCode);
            expect(product.code).toBe('PROD001');
        });
    });

    describe('Stock Management', () => {
        let productId: string;

        beforeEach(async () => {
            const product = await productService.create(testProduct1);
            productId = product.id;
        });

        it('should update product stock', async () => {
            const updatedProduct = await productService.updateStock(productId, 20);

            expect(updatedProduct.stock).toBe(20);
            expect(updatedProduct.updatedAt.getTime()).toBeGreaterThan(new Date().getTime() - 1000);
        });

        it('should adjust product stock positively', async () => {
            const updatedProduct = await productService.adjustStock(productId, 5);

            expect(updatedProduct.stock).toBe(15); // 10 + 5
        });

        it('should adjust product stock negatively', async () => {
            const updatedProduct = await productService.adjustStock(productId, -3);

            expect(updatedProduct.stock).toBe(7); // 10 - 3
        });

        it('should throw error when updating stock to negative value', async () => {
            await expect(
                productService.updateStock(productId, -5)
            ).rejects.toThrow('Stock quantity cannot be negative');
        });

        it('should throw error when adjusting stock below zero', async () => {
            await expect(
                productService.adjustStock(productId, -15)
            ).rejects.toThrow('Insufficient stock for this operation');
        });

        it('should throw error when trying to update stock of non-existent product', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

            await expect(
                productService.updateStock(nonExistentId, 10)
            ).rejects.toThrow('Product not found');
        });

        it('should throw error when trying to adjust stock of non-existent product', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

            await expect(
                productService.adjustStock(nonExistentId, 5)
            ).rejects.toThrow('Product not found');
        });
    });

    describe('Price Validation', () => {
        it('should validate purchase price is positive', async () => {
            const invalidProduct = {
                ...testProduct1,
                purchasePrice: '-100.00'
            };

            await expect(
                productService.create(invalidProduct)
            ).rejects.toThrow('Purchase price must be a valid positive number');
        });

        it('should validate sale price is positive', async () => {
            const invalidProduct = {
                ...testProduct1,
                salePrice: '-200.00'
            };

            await expect(
                productService.create(invalidProduct)
            ).rejects.toThrow('Sale price must be a valid positive number');
        });

        it('should validate sale price is not lower than purchase price', async () => {
            const invalidProduct = {
                ...testProduct1,
                purchasePrice: '2000.00',
                salePrice: '1500.00'
            };

            await expect(
                productService.create(invalidProduct)
            ).rejects.toThrow('Sale price should not be lower than purchase price');
        });

        it('should validate prices on update', async () => {
            const product = await productService.create(testProduct1);

            await expect(
                productService.update(product.id, { purchasePrice: '-100.00' })
            ).rejects.toThrow('Purchase price must be a valid positive number');
        });

        it('should validate price relationship on update', async () => {
            const product = await productService.create(testProduct1);

            await expect(
                productService.update(product.id, {
                    purchasePrice: '2500.00',
                    salePrice: '2000.00'
                })
            ).rejects.toThrow('Sale price should not be lower than purchase price');
        });
    });

    describe('Automatic Code Generation', () => {
        it('should generate automatic code when code is not provided', async () => {
            const productWithoutCode = {
                name: 'Test Product Auto Code',
                unit: 'UN',
                description: 'Test product for automatic code generation',
                stock: 5,
                purchasePrice: '100.00',
                salePrice: '150.00',
                saleType: 'retail'
            };

            const product = await productService.create(productWithoutCode);

            expect(product).toBeDefined();
            expect(product.code).toBeDefined();
            expect(product.code).toMatch(/^PROD\d{7}$/); // Should match PROD + 7 digits
            expect(product.name).toBe(productWithoutCode.name);
        });

        it('should generate sequential codes for multiple products', async () => {
            const product1Data = {
                name: 'Test Product 1',
                unit: 'UN',
                purchasePrice: '100.00',
                salePrice: '150.00',
                saleType: 'retail'
            };

            const product2Data = {
                name: 'Test Product 2',
                unit: 'UN',
                purchasePrice: '200.00',
                salePrice: '250.00',
                saleType: 'retail'
            };

            const product1 = await productService.create(product1Data);
            const product2 = await productService.create(product2Data);

            expect(product1.code).toMatch(/^PROD\d{7}$/);
            expect(product2.code).toMatch(/^PROD\d{7}$/);
            expect(product1.code).not.toBe(product2.code);

            // Extract sequence numbers and verify they are sequential
            const seq1 = parseInt(product1.code.substring(4));
            const seq2 = parseInt(product2.code.substring(4));
            expect(seq2).toBe(seq1 + 1);
        });

        it('should still accept manual code when provided', async () => {
            const productWithManualCode = {
                code: 'MANUAL001',
                name: 'Test Product Manual Code',
                unit: 'UN',
                purchasePrice: '100.00',
                salePrice: '150.00',
                saleType: 'retail'
            };

            const product = await productService.create(productWithManualCode);

            expect(product.code).toBe('MANUAL001');
            expect(product.name).toBe(productWithManualCode.name);
        });

        it('should ignore empty or whitespace-only code and generate automatic code', async () => {
            const productWithEmptyCode = {
                code: '   ',
                name: 'Test Product Empty Code',
                unit: 'UN',
                purchasePrice: '100.00',
                salePrice: '150.00',
                saleType: 'retail'
            };

            const product = await productService.create(productWithEmptyCode);

            expect(product.code).toMatch(/^PROD\d{7}$/);
            expect(product.name).toBe(productWithEmptyCode.name);
        });

        it('should validate uniqueness for manual codes', async () => {
            const product1 = {
                code: 'DUPLICATE001',
                name: 'Test Product 1',
                unit: 'UN',
                purchasePrice: '100.00',
                salePrice: '150.00',
                saleType: 'retail'
            };

            const product2 = {
                code: 'DUPLICATE001',
                name: 'Test Product 2',
                unit: 'UN',
                purchasePrice: '200.00',
                salePrice: '250.00',
                saleType: 'retail'
            };

            await productService.create(product1);

            await expect(
                productService.create(product2)
            ).rejects.toThrow('Product code already exists');
        });
    });

    describe('Data Persistence', () => {
        it('should persist data between operations', async () => {
            // Create product
            const createdProduct = await productService.create(testProduct1);

            // Retrieve product in separate operation
            const retrievedProduct = await productService.findById(createdProduct.id);

            expect(retrievedProduct).toBeDefined();
            expect(retrievedProduct!.name).toBe(testProduct1.name);

            // Update product
            await productService.update(createdProduct.id, { name: 'Updated Name' });

            // Retrieve updated product
            const updatedProduct = await productService.findById(createdProduct.id);
            expect(updatedProduct!.name).toBe('Updated Name');

            // Update stock
            await productService.updateStock(createdProduct.id, 50);

            // Retrieve product with updated stock
            const productWithNewStock = await productService.findById(createdProduct.id);
            expect(productWithNewStock!.stock).toBe(50);
        });
    });
});