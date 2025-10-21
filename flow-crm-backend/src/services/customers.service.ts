import { eq, ilike, or, and, sql, desc, asc } from 'drizzle-orm';
import { db } from '../db/connection';
import { customers } from '../db/schema/customers';
import { validateCpf, cleanCpf, formatCpf } from '../utils/cpf-cnpj-validator';
import { BaseFilters } from '../types/common.types';

/**
 * Customer entity interface
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer creation data interface
 */
export interface CreateCustomerData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address?: string | null;
}

/**
 * Customer update data interface
 */
export interface UpdateCustomerData {
  name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  address?: string | null;
}

/**
 * Customer filters interface
 */
export interface CustomerFilters extends BaseFilters {
  name?: string;
  email?: string;
  cpf?: string;
  search?: string;
}

/**
 * Customer service class containing all customer-related business logic
 */
export class CustomerService {
  /**
   * Find all customers with optional filtering
   */
  async findAll(filters: CustomerFilters = {}): Promise<Customer[]> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'name',
      sortOrder = 'asc',
      name,
      email,
      cpf,
      search
    } = filters;

    // Build where conditions
    const conditions = [];

    if (name) {
      conditions.push(ilike(customers.name, `%${name}%`));
    }

    if (email) {
      conditions.push(ilike(customers.email, `%${email}%`));
    }

    if (cpf) {
      const cleanedCpf = cleanCpf(cpf);
      conditions.push(ilike(customers.cpf, `%${cleanedCpf}%`));
    }

    // Global search across name, email, and CPF (same pattern as products)
    if (search) {
      const searchTerm = `%${search}%`;
      const cleanedSearchCpf = cleanCpf(search);

      conditions.push(
        or(
          ilike(customers.name, searchTerm),
          ilike(customers.email, searchTerm),
          ilike(customers.cpf, `%${cleanedSearchCpf}%`)
        )
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    let orderBy;
    if (sortBy === 'name') {
      orderBy = sortOrder === 'desc' ? desc(customers.name) : asc(customers.name);
    } else if (sortBy === 'email') {
      orderBy = sortOrder === 'desc' ? desc(customers.email) : asc(customers.email);
    } else if (sortBy === 'createdAt') {
      orderBy = sortOrder === 'desc' ? desc(customers.createdAt) : asc(customers.createdAt);
    } else {
      orderBy = sortOrder === 'desc' ? desc(customers.name) : asc(customers.name);
    }

    // Apply pagination
    const offset = (page - 1) * limit;

    const result = await db
      .select()
      .from(customers)
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Find customer by ID
   */
  async findById(id: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Create a new customer
   */
  async create(customerData: CreateCustomerData): Promise<Customer> {
    // Validate and clean CPF
    const cleanedCpf = cleanCpf(customerData.cpf);

    if (!validateCpf(cleanedCpf)) {
      throw new Error('Invalid CPF format');
    }

    // Check for CPF uniqueness
    await this.validateCpfUniqueness(cleanedCpf);

    // Check for email uniqueness
    await this.validateEmailUniqueness(customerData.email.toLowerCase().trim());

    // Sanitize and prepare data
    const sanitizedData = {
      name: customerData.name.trim(),
      email: customerData.email.toLowerCase().trim(),
      phone: customerData.phone.trim(),
      cpf: cleanedCpf,
      address: customerData.address?.trim() || null
    };

    const result = await db
      .insert(customers)
      .values(sanitizedData)
      .returning();

    return result[0];
  }

  /**
   * Update an existing customer
   */
  async update(id: string, customerData: UpdateCustomerData): Promise<Customer> {
    // Check if customer exists
    const existingCustomer = await this.findById(id);
    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (customerData.name !== undefined) {
      updateData.name = customerData.name.trim();
    }

    if (customerData.email !== undefined) {
      const email = customerData.email.toLowerCase().trim();
      // Check email uniqueness only if it's different from current email
      if (email !== existingCustomer.email) {
        await this.validateEmailUniqueness(email);
      }
      updateData.email = email;
    }

    if (customerData.phone !== undefined) {
      updateData.phone = customerData.phone.trim();
    }

    if (customerData.cpf !== undefined) {
      const cleanedCpf = cleanCpf(customerData.cpf);

      if (!validateCpf(cleanedCpf)) {
        throw new Error('Invalid CPF format');
      }

      // Check CPF uniqueness only if it's different from current CPF
      if (cleanedCpf !== existingCustomer.cpf) {
        await this.validateCpfUniqueness(cleanedCpf);
      }

      updateData.cpf = cleanedCpf;
    }

    if (customerData.address !== undefined) {
      updateData.address = customerData.address?.trim() || null;
    }

    const result = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();

    return result[0];
  }

  /**
   * Delete a customer
   */
  async delete(id: string): Promise<void> {
    // Check if customer exists
    const existingCustomer = await this.findById(id);
    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // Check for active pre-sales (this will be implemented when pre-sales are ready)
    // For now, we'll just delete the customer
    // TODO: Add constraint check for active pre-sales when pre-sales module is implemented

    await db
      .delete(customers)
      .where(eq(customers.id, id));
  }

  /**
   * Validate CPF format
   */
  validateCpf(cpf: string): boolean {
    return validateCpf(cpf);
  }

  /**
   * Format CPF for display
   */
  formatCpf(cpf: string): string {
    return formatCpf(cpf);
  }

  /**
   * Clean CPF removing formatting
   */
  cleanCpf(cpf: string): string {
    return cleanCpf(cpf);
  }

  /**
   * Count total customers with filters
   */
  async count(filters: CustomerFilters = {}): Promise<number> {
    const { name, email, cpf, search } = filters;

    const conditions = [];

    if (name) {
      conditions.push(ilike(customers.name, `%${name}%`));
    }

    if (email) {
      conditions.push(ilike(customers.email, `%${email}%`));
    }

    if (cpf) {
      const cleanedCpf = cleanCpf(cpf);
      conditions.push(ilike(customers.cpf, `%${cleanedCpf}%`));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      const cleanedSearchCpf = cleanCpf(search);
      conditions.push(
        or(
          ilike(customers.name, searchTerm),
          ilike(customers.email, searchTerm),
          ilike(customers.cpf, `%${cleanedSearchCpf}%`)
        )
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(whereCondition);

    return result[0].count;
  }

  /**
   * Private method to validate CPF uniqueness
   */
  private async validateCpfUniqueness(cpf: string): Promise<void> {
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.cpf, cpf))
      .limit(1);

    if (existing.length > 0) {
      throw new Error('CPF already exists');
    }
  }

  /**
   * Private method to validate email uniqueness
   */
  private async validateEmailUniqueness(email: string): Promise<void> {
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);

    if (existing.length > 0) {
      throw new Error('Email already exists');
    }
  }
}

// Export singleton instance
export const customerService = new CustomerService();