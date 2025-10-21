import { eq, ilike, or, and, sql, desc, asc } from 'drizzle-orm';
import { db } from '../db/connection';
import { products } from '../db/schema/products';
import { BaseFilters } from '../types/common.types';

/**
 * Product entity interface
 */
export interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  description?: string | null;
  stock: number;
  purchasePrice: string;
  salePrice: string;
  saleType: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product creation data interface
 */
export interface CreateProductData {
  code?: string;
  name: string;
  unit: string;
  description?: string | null;
  stock?: number;
  purchasePrice: string;
  salePrice: string;
  saleType: string;
}

/**
 * Product update data interface
 */
export interface UpdateProductData {
  code?: string;
  name?: string;
  unit?: string;
  description?: string | null;
  stock?: number;
  purchasePrice?: string;
  salePrice?: string;
  saleType?: string;
}

/**
 * Product filters interface
 */
export interface ProductFilters extends BaseFilters {
  code?: string;
  name?: string;
  saleType?: string;
  search?: string;
  minStock?: number;
  maxStock?: number;
}

/**
 * Product service class containing all product-related business logic
 */
export class ProductService {
  /**
   * Find all products with optional filtering
   */
  async findAll(filters: ProductFilters = {}): Promise<Product[]> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'name',
      sortOrder = 'asc',
      code,
      name,
      saleType,
      search,
      minStock,
      maxStock
    } = filters;

    // Build where conditions
    const conditions = [];

    if (code) {
      conditions.push(ilike(products.code, `%${code}%`));
    }

    if (name) {
      conditions.push(ilike(products.name, `%${name}%`));
    }

    if (saleType) {
      conditions.push(ilike(products.saleType, `%${saleType}%`));
    }

    if (minStock !== undefined) {
      conditions.push(sql`${products.stock} >= ${minStock}`);
    }

    if (maxStock !== undefined) {
      conditions.push(sql`${products.stock} <= ${maxStock}`);
    }

    // Global search across code, name, and description
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(products.code, searchTerm),
          ilike(products.name, searchTerm),
          ilike(products.description, searchTerm)
        )
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    let orderBy;
    if (sortBy === 'code') {
      orderBy = sortOrder === 'desc' ? desc(products.code) : asc(products.code);
    } else if (sortBy === 'name') {
      orderBy = sortOrder === 'desc' ? desc(products.name) : asc(products.name);
    } else if (sortBy === 'stock') {
      orderBy = sortOrder === 'desc' ? desc(products.stock) : asc(products.stock);
    } else if (sortBy === 'salePrice') {
      orderBy = sortOrder === 'desc' ? desc(products.salePrice) : asc(products.salePrice);
    } else if (sortBy === 'createdAt') {
      orderBy = sortOrder === 'desc' ? desc(products.createdAt) : asc(products.createdAt);
    } else {
      orderBy = sortOrder === 'desc' ? desc(products.name) : asc(products.name);
    }

    // Apply pagination
    const offset = (page - 1) * limit;

    const result = await db
      .select()
      .from(products)
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Find product by ID
   */
  async findById(id: string): Promise<Product | null> {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find product by code
   */
  async findByCode(code: string): Promise<Product | null> {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.code, code))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Create a new product
   */
  async create(productData: CreateProductData): Promise<Product> {
    // Validate price values first
    this.validatePrices(productData.purchasePrice, productData.salePrice);

    // Determine the product code - generate automatically if not provided
    let productCode: string;

    if (productData.code && productData.code.trim()) {
      // Manual code provided - validate uniqueness and format
      productCode = productData.code.trim().toUpperCase();
      await this.validateCodeUniqueness(productCode);
    } else {
      // Generate code automatically - simple implementation for task 7
      productCode = await this.generateNextCode();
    }

    // Sanitize and prepare data
    const sanitizedData = {
      code: productCode,
      name: productData.name.trim(),
      unit: productData.unit.trim(),
      description: productData.description?.trim() || null,
      stock: productData.stock || 0,
      purchasePrice: productData.purchasePrice,
      salePrice: productData.salePrice,
      saleType: productData.saleType.trim()
    };

    const result = await db
      .insert(products)
      .values(sanitizedData)
      .returning();

    return result[0];
  }

  /**
   * Update an existing product
   */
  async update(id: string, productData: UpdateProductData): Promise<Product> {
    // Check if product exists
    const existingProduct = await this.findById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (productData.code !== undefined) {
      const code = productData.code.trim().toUpperCase();
      // Check code uniqueness only if it's different from current code
      if (code !== existingProduct.code) {
        await this.validateCodeUniqueness(code);
      }
      updateData.code = code;
    }

    if (productData.name !== undefined) {
      updateData.name = productData.name.trim();
    }

    if (productData.unit !== undefined) {
      updateData.unit = productData.unit.trim();
    }

    if (productData.description !== undefined) {
      updateData.description = productData.description?.trim() || null;
    }

    if (productData.stock !== undefined) {
      updateData.stock = productData.stock;
    }

    if (productData.purchasePrice !== undefined) {
      updateData.purchasePrice = productData.purchasePrice;
    }

    if (productData.salePrice !== undefined) {
      updateData.salePrice = productData.salePrice;
    }

    // Validate prices if either is being updated
    if (productData.purchasePrice !== undefined || productData.salePrice !== undefined) {
      const purchasePrice = productData.purchasePrice || existingProduct.purchasePrice;
      const salePrice = productData.salePrice || existingProduct.salePrice;
      this.validatePrices(purchasePrice, salePrice);
    }

    if (productData.saleType !== undefined) {
      updateData.saleType = productData.saleType.trim();
    }

    const result = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    return result[0];
  }

  /**
   * Delete a product
   */
  async delete(id: string): Promise<void> {
    // Check if product exists
    const existingProduct = await this.findById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Check for references in pre-sales (this will be implemented when pre-sales are ready)
    // For now, we'll just delete the product
    // TODO: Add constraint check for active pre-sales when pre-sales module is implemented

    await db
      .delete(products)
      .where(eq(products.id, id));
  }

  /**
   * Update product stock
   */
  async updateStock(id: string, quantity: number): Promise<Product> {
    // Check if product exists
    const existingProduct = await this.findById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Validate stock quantity
    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    const result = await db
      .update(products)
      .set({
        stock: quantity,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();

    return result[0];
  }

  /**
   * Adjust product stock (add or subtract)
   */
  async adjustStock(id: string, adjustment: number): Promise<Product> {
    // Check if product exists
    const existingProduct = await this.findById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    const newStock = existingProduct.stock + adjustment;

    // Validate that stock doesn't go negative
    if (newStock < 0) {
      throw new Error('Insufficient stock for this operation');
    }

    const result = await db
      .update(products)
      .set({
        stock: newStock,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();

    return result[0];
  }

  /**
   * Count total products with filters
   */
  async count(filters: ProductFilters = {}): Promise<number> {
    const { code, name, saleType, search, minStock, maxStock } = filters;

    const conditions = [];

    if (code) {
      conditions.push(ilike(products.code, `%${code}%`));
    }

    if (name) {
      conditions.push(ilike(products.name, `%${name}%`));
    }

    if (saleType) {
      conditions.push(ilike(products.saleType, `%${saleType}%`));
    }

    if (minStock !== undefined) {
      conditions.push(sql`${products.stock} >= ${minStock}`);
    }

    if (maxStock !== undefined) {
      conditions.push(sql`${products.stock} <= ${maxStock}`);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(products.code, searchTerm),
          ilike(products.name, searchTerm),
          ilike(products.description, searchTerm)
        )
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereCondition);

    return result[0].count;
  }

  /**
   * Generate next automatic product code
   */
  private async generateNextCode(): Promise<string> {
    // Get the highest existing code number
    const result = await db
      .select({ code: products.code })
      .from(products)
      .where(sql`${products.code} ~ '^PROD[0-9]{7}$'`)
      .orderBy(desc(products.code))
      .limit(1);

    let nextNumber = 1;
    if (result.length > 0) {
      const lastCode = result[0].code;
      const lastNumber = parseInt(lastCode.substring(4), 10);
      nextNumber = lastNumber + 1;
    }

    // Format with zero padding
    const paddedNumber = nextNumber.toString().padStart(7, '0');
    return `PROD${paddedNumber}`;
  }

  /**
   * Private method to validate product code uniqueness
   */
  private async validateCodeUniqueness(code: string): Promise<void> {
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.code, code))
      .limit(1);

    if (existing.length > 0) {
      throw new Error('Product code already exists');
    }
  }

  /**
   * Private method to validate price values
   */
  private validatePrices(purchasePrice: string, salePrice: string): void {
    const purchase = parseFloat(purchasePrice);
    const sale = parseFloat(salePrice);

    if (isNaN(purchase) || purchase < 0) {
      throw new Error('Purchase price must be a valid positive number');
    }

    if (isNaN(sale) || sale < 0) {
      throw new Error('Sale price must be a valid positive number');
    }

    // Optional business rule: sale price should be higher than purchase price
    // This can be removed if not required
    if (sale < purchase) {
      throw new Error('Sale price should not be lower than purchase price');
    }
  }
}

// Export singleton instance
export const productService = new ProductService();