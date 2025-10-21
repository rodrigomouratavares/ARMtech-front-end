import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { preSalesService, CreatePreSaleData, UpdatePreSaleData } from '../src/services/presales.service';
import { customerService } from '../src/services/customers.service';
import { productService } from '../src/services/products.service';
import { db, checkDatabaseConnection } from '../src/db/connection';
import { preSales, preSaleItems } from '../src/db/schema/presales';
import { customers } from '../src/db/schema/customers';
import { products } from '../src/db/schema/products';

describe('PreSales Service Database Integration', () => {
    let testCustomerId: string;
    let testProduct1Id: string;
    let testProduct2Id: string;

    beforeAll(async () => {
        // Verify database connection
        const isConnected = await checkDatabaseConnection();
        expect(isConnected).toBe(true);
    });

    beforeEach(async () => {
        // Clean up test data before each test
        await db.delete(preSaleItems);
        await db.delete(preSales);
        await db.delete(products);
        await db.delete(customers);

        // Create test customer
        const customer = await customerService.create({
            name: 'João Silva',
            email: 'joao.silva@test.com',
            phone: '(11) 99999-9999',
            cpf: '123.456.789-09',
            address: 'Rua das Flores, 123'
        });
        testCustomerId = customer.id;

        // Create test products
        const product1 = await productService.create({
            code: 'PROD001',
            name: 'Notebook Dell',
            unit: 'UN',
            description: 'Notebook Dell Inspiron',
            stock: 10,
            purchasePrice: '1500.00',
            salePrice: '2000.00',
            saleType: 'retail'
        });
        testProduct1Id = product1.id;

        const product2 = await productService.create({
            code: 'PROD002',
            name: 'Mouse Logitech',
            unit: 'UN',
            description: 'Mouse Logitech MX Master',
            stock: 25,
            purchasePrice: '200.00',
            salePrice: '300.00',
            saleType: 'retail'
        });
        testProduct2Id = product2.id;
    });

    afterAll(async () => {
        // Clean up test data after all tests
        await db.delete(preSaleItems);
        await db.delete(preSales);
        await db.delete(products);
        await db.delete(customers);
    });

    describe('CRUD Operations', () => {
        it('should create a pre-sale with items', async () => {
            const preSaleData: CreatePreSaleData = {
                customerId: testCustomerId,
                status: 'draft',
                discount: '50.00',
                notes: 'Test pre-sale',
                items: [
                    {
                        productId: testProduct1Id,
                        quantity: '2',
                        unitPrice: '2000.00',
                        discount: '100.00'
                    },
                    {
                        productId: testProduct2Id,
                        quantity: '1',
                        unitPrice: '300.00',
                        discount: '0.00'
                    }
                ]
            };

            const preSale = await preSalesService.create(preSaleData);

            expect(preSale).toBeDefined();
            expect(preSale.id).toBeDefined();
            expect(preSale.customerId).toBe(testCustomerId);
            expect(preSale.status).toBe('draft');
            expect(preSale.discount).toBe('50.00');
            expect(preSale.notes).toBe('Test pre-sale');
            expect(preSale.items).toHaveLength(2);
            expect(preSale.customer.name).toBe('João Silva');

            // Check first item
            const item1 = preSale.items.find(item => item.productId === testProduct1Id);
            expect(item1).toBeDefined();
            expect(item1!.quantity).toBe('2.000');
            expect(item1!.unitPrice).toBe('2000.00');
            expect(item1!.discount).toBe('100.00');
            expect(item1!.totalPrice).toBe('3900.00'); // (2 * 2000) - 100
            expect(item1!.product.name).toBe('Notebook Dell');

            // Check second item
            const item2 = preSale.items.find(item => item.productId === testProduct2Id);
            expect(item2).toBeDefined();
            expect(item2!.quantity).toBe('1.000');
            expect(item2!.unitPrice).toBe('300.00');
            expect(item2!.discount).toBe('0.00');
            expect(item2!.totalPrice).toBe('300.00'); // (1 * 300) - 0
        });

        it('should retrieve a pre-sale by ID with items and customer data', async () => {
            const preSaleData: CreatePreSaleData = {
                customerId: testCustomerId,
                items: [
                    {
                        productId: testProduct1Id,
                        quantity: '1',
                        unitPrice: '2000.00'
                    }
                ]
            };

            const createdPreSale = await preSalesService.create(preSaleData);
            const foundPreSale = await preSalesService.findById(createdPreSale.id);

            expect(foundPreSale).toBeDefined();
            expect(foundPreSale!.id).toBe(createdPreSale.id);
            expect(foundPreSale!.customer.name).toBe('João Silva');
            expect(foundPreSale!.items).toHaveLength(1);
            expect(foundPreSale!.items[0].product.name).toBe('Notebook Dell');
        });

        it('should return null when pre-sale ID does not exist', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
            const preSale = await preSalesService.findById(nonExistentId);

            expect(preSale).toBeNull();
        });

        it('should update a pre-sale', async () => {
            const preSaleData: CreatePreSaleData = {
                customerId: testCustomerId,
                status: 'draft',
                items: [
                    {
                        productId: testProduct1Id,
                        quantity: '1',
                        unitPrice: '2000.00'
                    }
                ]
            };

            const createdPreSale = await preSalesService.create(preSaleData);

            const updateData: UpdatePreSaleData = {
                status: 'pending',
                notes: 'Updated notes',
                items: [
                    {
                        productId: testProduct2Id,
                        quantity: '2',
                        unitPrice: '300.00'
                    }
                ]
            };

            const updatedPreSale = await preSalesService.update(createdPreSale.id, updateData);

            expect(updatedPreSale.status).toBe('pending');
            expect(updatedPreSale.notes).toBe('Updated notes');
            expect(updatedPreSale.items).toHaveLength(1);
            expect(updatedPreSale.items[0].productId).toBe(testProduct2Id);
            expect(updatedPreSale.items[0].quantity).toBe('2.000');
            expect(updatedPreSale.updatedAt.getTime()).toBeGreaterThan(createdPreSale.updatedAt.getTime());
        });

        it('should delete a pre-sale and cascade delete items', async () => {
            const preSaleData: CreatePreSaleData = {
                customerId: testCustomerId,
                items: [
                    {
                        productId: testProduct1Id,
                        quantity: '1',
                        unitPrice: '2000.00'
                    }
                ]
            };

            const createdPreSale = await preSalesService.create(preSaleData);

            await preSalesService.delete(createdPreSale.id);

            const deletedPreSale = await preSalesService.findById(createdPreSale.id);
            expect(deletedPreSale).toBeNull();
        });

        it('should throw error when trying to update non-existent pre-sale', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

            await expect(
                preSalesService.update(nonExistentId, { notes: 'Test' })
            ).rejects.toThrow('Pre-sale not found');
        });

        it('should throw error when trying to delete non-existent pre-sale', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

            await expect(
                preSalesService.delete(nonExistentId)
            ).rejects.toThrow('Pre-sale not found');
        });
    });

    describe('Foreign Key Relationships', () => {
        it('should enforce customer foreign key constraint', async () => {
            const nonExistentCustomerId = '550e8400-e29b-41d4-a716-446655440000';

            const preSaleData: CreatePreSaleData = {
                customerId: nonExistentCustomerId,
                items: [
                    {
                        productId: testProduct1Id,
                        quantity: '1',
                        unitPrice: '2000.00'
                    }
                ]
            };

            await expect(
                preSalesService.create(preSaleData)
            ).rejects.toThrow('Customer not found');
        });

        it('should enforce product foreign key constraint in items', async () => {
            const nonExistentProductId = '550e8400-e29b-41d4-a716-446655440000';

            const preSaleData: CreatePreSaleData = {
                customerId: testCustomerId,
                items: [
                    {
                        productId: nonExistentProductId,
                        quantity: '1',
                        unitPrice: '2000.00'
                    }
                ]
            };

            await expect(
                preSalesService.create(preSaleData)
            ).rejects.toThrow();
        });

        it('should cascade delete items when pre-sale is deleted', async () => {
            const preSaleData: CreatePreSaleData = {
                customerId: testCustomerId,
                items: [
                    {
                        productId: testProduct1Id,
                        quantity: '1',
                        unitPrice: '2000.00'
                    },
                    {
                        productId: testProduct2Id,
                        quantity: '2',
                        unitPrice: '300.00'
                    }
                ]
            };

            const createdPreSale = await preSalesService.create(preSaleData);

            // Verify items exist
            const itemsBeforeDelete = await db
                .select()
                .from(preSaleItems)
                .where(eq(preSaleItems.preSaleId, createdPreSale.id));

            expect(itemsBeforeDelete).toHaveLength(2);

            // Delete pre-sale
            await preSalesService.delete(createdPreSale.id);

            // Verify items are also deleted
            const itemsAfterDelete = await db
                .select()
                .from(preSaleItems)
                .where(eq(preSaleItems.preSaleId, createdPreSale.id));

            expect(itemsAfterDelete).toHaveLength(0);
        });
    });

    describe('Status Management', () => {
        let preSaleId: string;

        beforeEach(async () => {
            const preSaleData: CreatePreSaleData = {
                customerId: testCustomerId,
                status: 'draft',
                items: [
                    {
                        productId: testProduct1Id,
                        quantity: '1',
                        unitPrice: '2000.00'
                    }
                ]
            };

            const preSale = await preSalesService.create(preSaleData);
            preSaleId = preSale.id;
        });

        it('should update pre-sale status with valid transition', async () => {
            const updatedPreSale = await preSalesService.updateStatus(preSaleId, 'pending');

            expect(updatedPreSale.status).toBe('pending');
            expect(updatedPreSale.updatedAt.getTime()).toBeGreaterThan(new Date().getTime() - 1000);
        });

        it('should allow valid status transitions', async () => {
            // draft -> pending
            await preSalesService.updateStatus(preSaleId, 'pending');

            // pending -> approved
            await preSalesService.updateStatus(preSaleId, 'approved');

            // approved -> converted
            const finalPreSale = await preSalesService.updateStatus(preSaleId, 'converted');
            expect(finalPreSale.status).toBe('converted');
        });

        it('should allow direct conversion from pending to converted', async () => {
            // Create a new presale for this test
            const newPreSale = await preSalesService.create({
                customerId: customerId,
                status: 'pending',
                discount: '0',
                discountType: 'fixed',
                discountPercentage: '0',
                notes: 'Test direct conversion',
                items: [{
                    productId: productId,
                    quantity: '1',
                    unitPrice: '10.00'
                }]
            });

            // pending -> converted (nova transição permitida)
            const convertedPreSale = await preSalesService.updateStatus(newPreSale.id, 'converted');
            expect(convertedPreSale.status).toBe('converted');
        });

        it('should reject invalid status transitions', async () => {
            // Try to go from draft directly to converted (invalid)
            await expect(
                preSalesService.updateStatus(preSaleId, 'converted')
            ).rejects.toThrow('Invalid status transition from draft to converted');
        });

        it('should reject transitions from final states', async () => {
            // Move to cancelled state
            await preSalesService.updateStatus(preSaleId, 'cancelled');

            // Try to transition from cancelled (should fail)
            await expect(
                preSalesService.updateStatus(preSaleId, 'pending')
            ).rejects.toThrow('Invalid status transition from cancelled to pending');
        });

        it('should throw error when trying to update status of non-existent pre-sale', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

            await expect(
                preSalesService.updateStatus(nonExistentId, 'pending')
            ).rejects.toThrow('Pre-sale not found');
        });
    });

    describe('Search and Filtering', () => {
        beforeEach(async () => {
            // Create multiple pre-sales for testing
            const preSale1: CreatePreSaleData = {
                customerId: testCustomerId,
                status: 'draft',
                items: [
                    {
                        productId: testProduct1Id,
                        quantity: '1',
                        unitPrice: '2000.00'
                    }
                ]
            };

            const preSale2: CreatePreSaleData = {
                customerId: testCustomerId,
                status: 'pending',
                items: [
                    {
                        productId: testProduct2Id,
                        quantity: '2',
                        unitPrice: '300.00'
                    }
                ]
            };

            await preSalesService.create(preSale1);
            await preSalesService.create(preSale2);
        });

        it('should find all pre-sales without filters', async () => {
            const preSales = await preSalesService.findAll();

            expect(preSales).toHaveLength(2);
        });

        it('should filter pre-sales by customer ID', async () => {
            const preSales = await preSalesService.findAll({ customerId: testCustomerId });

            expect(preSales).toHaveLength(2);
            expect(preSales.every(p => p.customerId === testCustomerId)).toBe(true);
        });

        it('should filter pre-sales by status', async () => {
            const draftPreSales = await preSalesService.findAll({ status: 'draft' });
            const pendingPreSales = await preSalesService.findAll({ status: 'pending' });

            expect(draftPreSales).toHaveLength(1);
            expect(draftPreSales[0].status).toBe('draft');
            expect(pendingPreSales).toHaveLength(1);
            expect(pendingPreSales[0].status).toBe('pending');
        });

        it('should filter pre-sales by multiple statuses', async () => {
            const preSales = await preSalesService.findAll({ status: ['draft', 'pending'] });

            expect(preSales).toHaveLength(2);
        });

        it('should support pagination', async () => {
            const page1 = await preSalesService.findAll({ page: 1, limit: 1 });
            const page2 = await preSalesService.findAll({ page: 2, limit: 1 });

            expect(page1).toHaveLength(1);
            expect(page2).toHaveLength(1);
            expect(page1[0].id).not.toBe(page2[0].id);
        });

        it('should support sorting by creation date', async () => {
            const preSalesAsc = await preSalesService.findAll({ sortBy: 'createdAt', sortOrder: 'asc' });
            const preSalesDesc = await preSalesService.findAll({ sortBy: 'createdAt', sortOrder: 'desc' });

            expect(preSalesAsc).toHaveLength(2);
            expect(preSalesDesc).toHaveLength(2);
            expect(preSalesAsc[0].createdAt.getTime()).toBeLessThanOrEqual(preSalesAsc[1].createdAt.getTime());
            expect(preSalesDesc[0].createdAt.getTime()).toBeGreaterThanOrEqual(preSalesDesc[1].createdAt.getTime());
        });

        it('should count pre-sales with filters', async () => {
            const totalCount = await preSalesService.count();
            const draftCount = await preSalesService.count({ status: 'draft' });

            expect(Number(totalCount)).toBe(2);
            expect(Number(draftCount)).toBe(1);
        });
    });

    describe('Item Management', () => {
        it('should handle multiple items in a pre-sale', async () => {
            const preSaleData: CreatePreSaleData = {
                customerId: testCustomerId,
                items: [
                    {
                        productId: testProduct1Id,
                        quantity: '2',
                        unitPrice: '2000.00',
                        discount: '100.00'
                    },
                    {
                        productId: testProduct2Id,
                        quantity: '3',
                        unitPrice: '300.00',
                        discount: '50.00'
                    }
                ]
            };

            const preSale = await preSalesService.create(preSaleData);

            expect(preSale.items).toHaveLength(2);

            const item1 = preSale.items.find(item => item.productId === testProduct1Id);
            const item2 = preSale.items.find(item => item.productId === testProduct2Id);

            expect(item1!.totalPrice).toBe('3900.00'); // (2 * 2000) - 100
            expect(item2!.totalPrice).toBe('850.00'); // (3 * 300) - 50
        });

        it('should update items when updating pre-sale', async () => {
            const preSaleData: CreatePreSaleData = {
                customerId: testCustomerId,
                items: [
                    {
                        productId: testProduct1Id,
                        quantity: '1',
                        unitPrice: '2000.00'
                    }
                ]
            };

            const createdPreSale = await preSalesService.create(preSaleData);

            const updateData: UpdatePreSaleData = {
                items: [
                    {
                        productId: testProduct1Id,
                        quantity: '2',
                        unitPrice: '1800.00'
                    },
                    {
                        productId: testProduct2Id,
                        quantity: '1',
                        unitPrice: '300.00'
                    }
                ]
            };

            const updatedPreSale = await preSalesService.update(createdPreSale.id, updateData);

            expect(updatedPreSale.items).toHaveLength(2);

            const item1 = updatedPreSale.items.find(item => item.productId === testProduct1Id);
            const item2 = updatedPreSale.items.find(item => item.productId === testProduct2Id);

            expect(item1!.quantity).toBe('2.000');
            expect(item1!.unitPrice).toBe('1800.00');
            expect(item2!.quantity).toBe('1.000');
            expect(item2!.unitPrice).toBe('300.00');
        });
    });

    describe('Data Persistence', () => {
        it('should persist data between operations', async () => {
            // Create pre-sale
            const preSaleData: CreatePreSaleData = {
                customerId: testCustomerId,
                status: 'draft',
                notes: 'Test persistence',
                items: [
                    {
                        productId: testProduct1Id,
                        quantity: '1',
                        unitPrice: '2000.00'
                    }
                ]
            };

            const createdPreSale = await preSalesService.create(preSaleData);

            // Retrieve pre-sale in separate operation
            const retrievedPreSale = await preSalesService.findById(createdPreSale.id);

            expect(retrievedPreSale).toBeDefined();
            expect(retrievedPreSale!.notes).toBe('Test persistence');
            expect(retrievedPreSale!.items).toHaveLength(1);

            // Update status
            await preSalesService.updateStatus(createdPreSale.id, 'pending');

            // Retrieve updated pre-sale
            const updatedPreSale = await preSalesService.findById(createdPreSale.id);
            expect(updatedPreSale!.status).toBe('pending');

            // Update items
            await preSalesService.update(createdPreSale.id, {
                items: [
                    {
                        productId: testProduct2Id,
                        quantity: '2',
                        unitPrice: '300.00'
                    }
                ]
            });

            // Retrieve pre-sale with updated items
            const preSaleWithNewItems = await preSalesService.findById(createdPreSale.id);
            expect(preSaleWithNewItems!.items).toHaveLength(1);
            expect(preSaleWithNewItems!.items[0].productId).toBe(testProduct2Id);
        });
    });
});