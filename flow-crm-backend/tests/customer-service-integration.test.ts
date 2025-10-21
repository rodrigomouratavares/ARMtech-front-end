import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { customerService, CreateCustomerData, UpdateCustomerData } from '../src/services/customers.service';
import { db, checkDatabaseConnection } from '../src/db/connection';
import { customers } from '../src/db/schema/customers';

describe('Customer Service Database Integration', () => {
    // Test data
    const testCustomer1: CreateCustomerData = {
        name: 'João Silva',
        email: 'joao.silva@test.com',
        phone: '(11) 99999-9999',
        cpf: '123.456.789-09',
        address: 'Rua das Flores, 123'
    };

    const testCustomer2: CreateCustomerData = {
        name: 'Maria Santos',
        email: 'maria.santos@test.com',
        phone: '(11) 88888-8888',
        cpf: '987.654.321-00',
        address: 'Av. Paulista, 456'
    };

    beforeAll(async () => {
        // Verify database connection
        const isConnected = await checkDatabaseConnection();
        expect(isConnected).toBe(true);
    });

    beforeEach(async () => {
        // Clean up test data before each test
        await db.delete(customers);
    });

    afterAll(async () => {
        // Clean up test data after all tests
        await db.delete(customers);
    });

    describe('CRUD Operations', () => {
        it('should create a customer with valid data', async () => {
            const customer = await customerService.create(testCustomer1);

            expect(customer).toBeDefined();
            expect(customer.id).toBeDefined();
            expect(customer.name).toBe(testCustomer1.name);
            expect(customer.email).toBe(testCustomer1.email.toLowerCase());
            expect(customer.phone).toBe(testCustomer1.phone);
            expect(customer.cpf).toBe('12345678909'); // CPF should be cleaned
            expect(customer.address).toBe(testCustomer1.address);
            expect(customer.createdAt).toBeInstanceOf(Date);
            expect(customer.updatedAt).toBeInstanceOf(Date);
        });

        it('should retrieve a customer by ID', async () => {
            const createdCustomer = await customerService.create(testCustomer1);
            const foundCustomer = await customerService.findById(createdCustomer.id);

            expect(foundCustomer).toBeDefined();
            expect(foundCustomer!.id).toBe(createdCustomer.id);
            expect(foundCustomer!.name).toBe(createdCustomer.name);
            expect(foundCustomer!.email).toBe(createdCustomer.email);
        });

        it('should return null when customer ID does not exist', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
            const customer = await customerService.findById(nonExistentId);

            expect(customer).toBeNull();
        });

        it('should update a customer with valid data', async () => {
            const createdCustomer = await customerService.create(testCustomer1);

            const updateData: UpdateCustomerData = {
                name: 'João Silva Updated',
                phone: '(11) 77777-7777'
            };

            const updatedCustomer = await customerService.update(createdCustomer.id, updateData);

            expect(updatedCustomer.name).toBe(updateData.name);
            expect(updatedCustomer.phone).toBe(updateData.phone);
            expect(updatedCustomer.email).toBe(createdCustomer.email); // Should remain unchanged
            expect(updatedCustomer.updatedAt.getTime()).toBeGreaterThan(createdCustomer.updatedAt.getTime());
        });

        it('should delete a customer', async () => {
            const createdCustomer = await customerService.create(testCustomer1);

            await customerService.delete(createdCustomer.id);

            const deletedCustomer = await customerService.findById(createdCustomer.id);
            expect(deletedCustomer).toBeNull();
        });

        it('should throw error when trying to update non-existent customer', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

            await expect(
                customerService.update(nonExistentId, { name: 'Test' })
            ).rejects.toThrow('Customer not found');
        });

        it('should throw error when trying to delete non-existent customer', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

            await expect(
                customerService.delete(nonExistentId)
            ).rejects.toThrow('Customer not found');
        });
    });

    describe('Search and Filtering', () => {
        beforeEach(async () => {
            // Create test customers for search tests
            await customerService.create(testCustomer1);
            await customerService.create(testCustomer2);
        });

        it('should find all customers without filters', async () => {
            const customers = await customerService.findAll();

            expect(customers).toHaveLength(2);
            expect(customers.some(c => c.name === testCustomer1.name)).toBe(true);
            expect(customers.some(c => c.name === testCustomer2.name)).toBe(true);
        });

        it('should filter customers by name', async () => {
            const customers = await customerService.findAll({ name: 'João' });

            expect(customers).toHaveLength(1);
            expect(customers[0].name).toBe(testCustomer1.name);
        });

        it('should filter customers by email', async () => {
            const customers = await customerService.findAll({ email: 'maria.santos' });

            expect(customers).toHaveLength(1);
            expect(customers[0].email).toBe(testCustomer2.email.toLowerCase());
        });

        it('should filter customers by CPF', async () => {
            const customers = await customerService.findAll({ cpf: '123.456' });

            expect(customers).toHaveLength(1);
            expect(customers[0].cpf).toBe('12345678909');
        });

        it('should perform global search across name, email, and CPF', async () => {
            // Test search by unique part of second customer's email
            const customers = await customerService.findAll({ search: '987.654' });

            expect(customers).toHaveLength(1);
            expect(customers[0].name).toBe(testCustomer2.name);
        });

        it('should support pagination', async () => {
            const page1 = await customerService.findAll({ page: 1, limit: 1 });
            const page2 = await customerService.findAll({ page: 2, limit: 1 });

            expect(page1).toHaveLength(1);
            expect(page2).toHaveLength(1);
            expect(page1[0].id).not.toBe(page2[0].id);
        });

        it('should support sorting by name', async () => {
            const customersAsc = await customerService.findAll({ sortBy: 'name', sortOrder: 'asc' });
            const customersDesc = await customerService.findAll({ sortBy: 'name', sortOrder: 'desc' });

            expect(customersAsc[0].name).toBe('João Silva');
            expect(customersDesc[0].name).toBe('Maria Santos');
        });

        it('should count customers with filters', async () => {
            const totalCount = await customerService.count();
            const filteredCount = await customerService.count({ name: 'João' });

            expect(Number(totalCount)).toBe(2);
            expect(Number(filteredCount)).toBe(1);
        });
    });

    describe('CPF Uniqueness Constraint', () => {
        it('should enforce CPF uniqueness on creation', async () => {
            await customerService.create(testCustomer1);

            const duplicateCustomer = {
                ...testCustomer2,
                cpf: testCustomer1.cpf // Same CPF
            };

            await expect(
                customerService.create(duplicateCustomer)
            ).rejects.toThrow('CPF already exists');
        });

        it('should enforce CPF uniqueness on update', async () => {
            const customer1 = await customerService.create(testCustomer1);
            const customer2 = await customerService.create(testCustomer2);

            await expect(
                customerService.update(customer2.id, { cpf: testCustomer1.cpf })
            ).rejects.toThrow('CPF already exists');
        });

        it('should allow updating customer with same CPF', async () => {
            const customer = await customerService.create(testCustomer1);

            const updatedCustomer = await customerService.update(customer.id, {
                cpf: testCustomer1.cpf,
                name: 'Updated Name'
            });

            expect(updatedCustomer.name).toBe('Updated Name');
            expect(updatedCustomer.cpf).toBe('12345678909');
        });

        it('should validate CPF format', async () => {
            const invalidCustomer = {
                ...testCustomer1,
                cpf: '123.456.789-00' // Invalid CPF
            };

            await expect(
                customerService.create(invalidCustomer)
            ).rejects.toThrow('Invalid CPF format');
        });
    });

    describe('Email Uniqueness Constraint', () => {
        it('should enforce email uniqueness on creation', async () => {
            await customerService.create(testCustomer1);

            const duplicateCustomer = {
                ...testCustomer2,
                email: testCustomer1.email // Same email
            };

            await expect(
                customerService.create(duplicateCustomer)
            ).rejects.toThrow('Email already exists');
        });

        it('should enforce email uniqueness on update', async () => {
            const customer1 = await customerService.create(testCustomer1);
            const customer2 = await customerService.create(testCustomer2);

            await expect(
                customerService.update(customer2.id, { email: testCustomer1.email })
            ).rejects.toThrow('Email already exists');
        });

        it('should allow updating customer with same email', async () => {
            const customer = await customerService.create(testCustomer1);

            const updatedCustomer = await customerService.update(customer.id, {
                email: testCustomer1.email,
                name: 'Updated Name'
            });

            expect(updatedCustomer.name).toBe('Updated Name');
            expect(updatedCustomer.email).toBe(testCustomer1.email.toLowerCase());
        });

        it('should handle case-insensitive email uniqueness', async () => {
            await customerService.create(testCustomer1);

            const duplicateCustomer = {
                ...testCustomer2,
                email: testCustomer1.email.toUpperCase() // Same email, different case
            };

            await expect(
                customerService.create(duplicateCustomer)
            ).rejects.toThrow('Email already exists');
        });
    });

    describe('Data Persistence', () => {
        it('should persist data between operations', async () => {
            // Create customer
            const createdCustomer = await customerService.create(testCustomer1);

            // Retrieve customer in separate operation
            const retrievedCustomer = await customerService.findById(createdCustomer.id);

            expect(retrievedCustomer).toBeDefined();
            expect(retrievedCustomer!.name).toBe(testCustomer1.name);

            // Update customer
            await customerService.update(createdCustomer.id, { name: 'Updated Name' });

            // Retrieve updated customer
            const updatedCustomer = await customerService.findById(createdCustomer.id);
            expect(updatedCustomer!.name).toBe('Updated Name');
        });
    });
});