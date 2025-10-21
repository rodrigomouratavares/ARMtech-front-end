import { eq, ilike, and, desc, asc, sql } from 'drizzle-orm';
import { db } from '../db/connection';
import { paymentMethods } from '../db/schema/payment-methods';
import { BaseFilters } from '../types/common.types';
import { productCodeGenerator } from './product-code-generator.service';

/**
 * Payment Method entity interface
 */
export interface PaymentMethod {
  id: string;
  code: string;
  description: string;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment Method creation data interface
 */
export interface CreatePaymentMethodData {
  description: string;
  isActive?: boolean;
  createdBy?: string;
}

/**
 * Payment Method update data interface
 */
export interface UpdatePaymentMethodData {
  description?: string;
  isActive?: boolean;
}

/**
 * Payment Method filters interface
 */
export interface PaymentMethodFilters extends BaseFilters {
  isActive?: boolean;
  search?: string;
}

/**
 * Payment Method service class containing all payment method-related business logic
 */
export class PaymentMethodService {
  /**
   * Find all payment methods with optional filtering
   */
  async findAll(filters: PaymentMethodFilters = {}): Promise<PaymentMethod[]> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'description',
      sortOrder = 'asc',
      isActive,
      search
    } = filters;

    // Build where conditions
    const conditions = [];

    if (isActive !== undefined) {
      conditions.push(eq(paymentMethods.isActive, isActive));
    }

    // Global search across code and description
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql`(${ilike(paymentMethods.code, searchTerm)} OR ${ilike(paymentMethods.description, searchTerm)})`
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    let orderBy;
    if (sortBy === 'code') {
      orderBy = sortOrder === 'desc' ? desc(paymentMethods.code) : asc(paymentMethods.code);
    } else if (sortBy === 'description') {
      orderBy = sortOrder === 'desc' ? desc(paymentMethods.description) : asc(paymentMethods.description);
    } else if (sortBy === 'createdAt') {
      orderBy = sortOrder === 'desc' ? desc(paymentMethods.createdAt) : asc(paymentMethods.createdAt);
    } else {
      orderBy = sortOrder === 'desc' ? desc(paymentMethods.description) : asc(paymentMethods.description);
    }

    // Apply pagination
    const offset = (page - 1) * limit;

    const result = await db
      .select()
      .from(paymentMethods)
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Count total payment methods with filters
   */
  async count(filters: PaymentMethodFilters = {}): Promise<number> {
    const { isActive, search } = filters;

    const conditions = [];

    if (isActive !== undefined) {
      conditions.push(eq(paymentMethods.isActive, isActive));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql`(${ilike(paymentMethods.code, searchTerm)} OR ${ilike(paymentMethods.description, searchTerm)})`
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(paymentMethods)
      .where(whereCondition);

    return result[0]?.count || 0;
  }

  /**
   * Find payment method by ID
   */
  async findById(id: string): Promise<PaymentMethod | null> {
    const result = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find payment method by code
   */
  async findByCode(code: string): Promise<PaymentMethod | null> {
    const result = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.code, code))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Create a new payment method
   */
  async create(data: CreatePaymentMethodData): Promise<PaymentMethod> {
    // Generate unique code automatically using existing generator
    const code = await this.generateNextCode();

    // Sanitize and prepare data
    const sanitizedData = {
      code,
      description: data.description.trim(),
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: data.createdBy || null
    };

    // Insert into database
    const result = await db
      .insert(paymentMethods)
      .values(sanitizedData)
      .returning();

    return result[0];
  }

  /**
   * Update a payment method
   */
  async update(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethod | null> {
    // Check if payment method exists
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    // Update in database
    const result = await db
      .update(paymentMethods)
      .set(updateData)
      .where(eq(paymentMethods.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Soft delete a payment method (set isActive to false)
   */
  async softDelete(id: string): Promise<boolean> {
    // Check if payment method exists
    const existing = await this.findById(id);
    if (!existing) {
      return false;
    }

    // Check if payment method is being used in presales
    const isInUse = await this.isPaymentMethodInUse(id);
    if (isInUse) {
      throw new Error('Cannot delete payment method that is being used in presales');
    }

    // Set isActive to false
    await db
      .update(paymentMethods)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(paymentMethods.id, id));

    return true;
  }

  /**
   * Hard delete a payment method (permanent)
   */
  async delete(id: string): Promise<boolean> {
    // Check if payment method exists
    const existing = await this.findById(id);
    if (!existing) {
      return false;
    }

    // Check if payment method is being used
    const isInUse = await this.isPaymentMethodInUse(id);
    if (isInUse) {
      throw new Error('Cannot delete payment method that is being used in presales');
    }

    // Delete from database
    await db
      .delete(paymentMethods)
      .where(eq(paymentMethods.id, id));

    return true;
  }

  /**
   * Check if payment method is being used in presales
   * TODO: Implement when presales table has paymentMethodId
   */
  private async isPaymentMethodInUse(id: string): Promise<boolean> {
    // For now, return false
    // When presales table is updated with paymentMethodId field, implement this check
    return false;
  }

  /**
   * Generate next sequential code for payment method
   * Uses the existing product code generator service
   */
  private async generateNextCode(): Promise<string> {
    // Get all existing codes
    const allPaymentMethods = await db
      .select({ code: paymentMethods.code })
      .from(paymentMethods);

    const existingCodes = allPaymentMethods.map(pm => pm.code);

    // Use the product code generator to find next available code
    // This ensures consistency with the existing code generation system
    let nextNumber = 1;
    let code = `PM${String(nextNumber).padStart(4, '0')}`;

    while (existingCodes.includes(code)) {
      nextNumber++;
      code = `PM${String(nextNumber).padStart(4, '0')}`;
    }

    return code;
  }

  /**
   * Validate that description is unique
   */
  async validateDescriptionUniqueness(description: string, excludeId?: string): Promise<void> {
    const existing = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          sql`LOWER(${paymentMethods.description}) = LOWER(${description})`,
          excludeId ? sql`${paymentMethods.id} != ${excludeId}` : undefined
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error('A payment method with this description already exists');
    }
  }
}

// Export singleton instance
export const paymentMethodService = new PaymentMethodService();
