import { eq, ilike, or, and, sql, desc, asc, inArray } from 'drizzle-orm';
import { db } from '../db/connection';
import { preSales, preSaleItems } from '../db/schema/presales';
import { customers } from '../db/schema/customers';
import { products } from '../db/schema/products';
import { BaseFilters, PreSaleStatus } from '../types/common.types';
import {
  calculatePreSaleTotals,
  validateStockForPreSale,
  PreSaleItemCalculation,
  roundMoney,
  calculateDiscountWithConversion,
  DiscountType as CalcDiscountType
} from '../utils/presales-calculations';
import { stockAdjustmentService } from './stock-adjustment.service';
import { stockAdjustments } from '../db/schema/stock-adjustments';

/**
 * Discount type
 */
export type DiscountType = 'fixed' | 'percentage';

/**
 * PreSale entity interface
 */
export interface PreSale {
  id: string;
  customerId: string;
  status: PreSaleStatus;
  total: string;
  discount: string;
  discountType: DiscountType;
  discountPercentage: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PreSaleItem entity interface
 */
export interface PreSaleItem {
  id: string;
  preSaleId: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  discount: string;
  discountType: DiscountType;
  discountPercentage: string;
}

/**
 * PreSale with items and related data
 */
export interface PreSaleWithItems extends PreSale {
  items: (PreSaleItem & {
    product: {
      id: string;
      code: string;
      name: string;
      unit: string;
      stock: number;
    };
  })[];
  customer: {
    id: string;
    name: string;
    email: string;
    cpf: string;
  };
}

/**
 * PreSale creation data interface
 */
export interface CreatePreSaleData {
  customerId: string;
  status?: PreSaleStatus;
  discount?: string;
  discountType?: DiscountType;
  discountPercentage?: string;
  notes?: string | null;
  items: CreatePreSaleItemData[];
}

/**
 * PreSaleItem creation data interface
 */
export interface CreatePreSaleItemData {
  productId: string;
  quantity: string;
  unitPrice: string;
  discount?: string;
  discountType?: DiscountType;
  discountPercentage?: string;
}

/**
 * PreSale update data interface
 */
export interface UpdatePreSaleData {
  customerId?: string;
  status?: PreSaleStatus;
  discount?: string;
  discountType?: DiscountType;
  discountPercentage?: string;
  notes?: string | null;
  items?: UpdatePreSaleItemData[];
}

/**
 * PreSaleItem update data interface
 */
export interface UpdatePreSaleItemData {
  id?: string; // If provided, update existing item; if not, create new item
  productId: string;
  quantity: string;
  unitPrice: string;
  discount?: string;
  discountType?: DiscountType;
  discountPercentage?: string;
}

/**
 * PreSales filters interface
 */
export interface PreSalesFilters extends BaseFilters {
  customerId?: string;
  status?: PreSaleStatus | PreSaleStatus[];
  customerName?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * PreSales service class containing all pre-sales-related business logic
 */
export class PreSalesService {
  /**
   * Find all pre-sales with optional filtering
   */
  async findAll(filters: PreSalesFilters = {}): Promise<PreSaleWithItems[]> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      customerId,
      status,
      customerName,
      dateFrom,
      dateTo,
      search
    } = filters;

    // Build where conditions
    const conditions = [];

    if (customerId) {
      conditions.push(eq(preSales.customerId, customerId));
    }

    if (status) {
      if (Array.isArray(status)) {
        conditions.push(inArray(preSales.status, status));
      } else {
        conditions.push(eq(preSales.status, status));
      }
    }

    if (dateFrom) {
      conditions.push(sql`${preSales.createdAt} >= ${new Date(dateFrom)}`);
    }

    if (dateTo) {
      conditions.push(sql`${preSales.createdAt} <= ${new Date(dateTo)}`);
    }

    // Handle customer name search and global search
    if (customerName || search) {
      const searchTerm = customerName || search;
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${customers} 
          WHERE ${customers.id} = ${preSales.customerId} 
          AND ${ilike(customers.name, `%${searchTerm}%`)}
        )`
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    let orderBy;
    if (sortBy === 'createdAt') {
      orderBy = sortOrder === 'desc' ? desc(preSales.createdAt) : asc(preSales.createdAt);
    } else if (sortBy === 'total') {
      orderBy = sortOrder === 'desc' ? desc(preSales.total) : asc(preSales.total);
    } else if (sortBy === 'status') {
      orderBy = sortOrder === 'desc' ? desc(preSales.status) : asc(preSales.status);
    } else {
      orderBy = sortOrder === 'desc' ? desc(preSales.createdAt) : asc(preSales.createdAt);
    }

    // Apply pagination
    const offset = (page - 1) * limit;

    // Get pre-sales with customer data
    const preSaleResults = await db
      .select({
        id: preSales.id,
        customerId: preSales.customerId,
        status: preSales.status,
        total: preSales.total,
        discount: preSales.discount,
        discountType: preSales.discountType,
        discountPercentage: preSales.discountPercentage,
        notes: preSales.notes,
        createdAt: preSales.createdAt,
        updatedAt: preSales.updatedAt,
        customerName: customers.name,
        customerEmail: customers.email,
        customerCpf: customers.cpf,
      })
      .from(preSales)
      .innerJoin(customers, eq(preSales.customerId, customers.id))
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get items for all pre-sales in a single query
    const preSaleIds = preSaleResults.map(ps => ps.id);

    let itemsResults: any[] = [];
    if (preSaleIds.length > 0) {
      itemsResults = await db
        .select({
          id: preSaleItems.id,
          preSaleId: preSaleItems.preSaleId,
          productId: preSaleItems.productId,
          quantity: preSaleItems.quantity,
          unitPrice: preSaleItems.unitPrice,
          totalPrice: preSaleItems.totalPrice,
          discount: preSaleItems.discount,
          discountType: preSaleItems.discountType,
          discountPercentage: preSaleItems.discountPercentage,
          productCode: products.code,
          productName: products.name,
          productUnit: products.unit,
          productStock: products.stock,
        })
        .from(preSaleItems)
        .innerJoin(products, eq(preSaleItems.productId, products.id))
        .where(inArray(preSaleItems.preSaleId, preSaleIds));
    }

    // Group items by pre-sale ID
    const itemsByPresaleId = itemsResults.reduce((acc, item) => {
      if (!acc[item.preSaleId]) {
        acc[item.preSaleId] = [];
      }
      acc[item.preSaleId].push({
        id: item.id,
        preSaleId: item.preSaleId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discount: item.discount,
        discountType: item.discountType,
        discountPercentage: item.discountPercentage,
        product: {
          id: item.productId,
          code: item.productCode,
          name: item.productName,
          unit: item.productUnit,
          stock: item.productStock,
        },
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Format the response
    const results: PreSaleWithItems[] = preSaleResults.map((preSale) => ({
      id: preSale.id,
      customerId: preSale.customerId,
      status: preSale.status,
      total: preSale.total,
      discount: preSale.discount,
      discountType: preSale.discountType,
      discountPercentage: preSale.discountPercentage,
      notes: preSale.notes,
      createdAt: preSale.createdAt,
      updatedAt: preSale.updatedAt,
      customer: {
        id: preSale.customerId,
        name: preSale.customerName,
        email: preSale.customerEmail,
        cpf: preSale.customerCpf,
      },
      items: itemsByPresaleId[preSale.id] || [],
    }));

    return results;
  }

  /**
   * Find pre-sale by ID with items and related data
   */
  async findById(id: string): Promise<PreSaleWithItems | null> {
    // Get pre-sale with customer data
    const preSaleResult = await db
      .select({
        id: preSales.id,
        customerId: preSales.customerId,
        status: preSales.status,
        total: preSales.total,
        discount: preSales.discount,
        discountType: preSales.discountType,
        discountPercentage: preSales.discountPercentage,
        notes: preSales.notes,
        createdAt: preSales.createdAt,
        updatedAt: preSales.updatedAt,
        customerName: customers.name,
        customerEmail: customers.email,
        customerCpf: customers.cpf,
      })
      .from(preSales)
      .innerJoin(customers, eq(preSales.customerId, customers.id))
      .where(eq(preSales.id, id))
      .limit(1);

    if (preSaleResult.length === 0) {
      return null;
    }

    const preSale = preSaleResult[0];

    // Get pre-sale items with product data
    const itemsResult = await db
      .select({
        id: preSaleItems.id,
        preSaleId: preSaleItems.preSaleId,
        productId: preSaleItems.productId,
        quantity: preSaleItems.quantity,
        unitPrice: preSaleItems.unitPrice,
        totalPrice: preSaleItems.totalPrice,
        discount: preSaleItems.discount,
        discountType: preSaleItems.discountType,
        discountPercentage: preSaleItems.discountPercentage,
        productCode: products.code,
        productName: products.name,
        productUnit: products.unit,
        productStock: products.stock,
      })
      .from(preSaleItems)
      .innerJoin(products, eq(preSaleItems.productId, products.id))
      .where(eq(preSaleItems.preSaleId, id));

    // Format the response
    const result: PreSaleWithItems = {
      id: preSale.id,
      customerId: preSale.customerId,
      status: preSale.status,
      total: preSale.total,
      discount: preSale.discount,
      discountType: preSale.discountType,
      discountPercentage: preSale.discountPercentage,
      notes: preSale.notes,
      createdAt: preSale.createdAt,
      updatedAt: preSale.updatedAt,
      customer: {
        id: preSale.customerId,
        name: preSale.customerName,
        email: preSale.customerEmail,
        cpf: preSale.customerCpf,
      },
      items: itemsResult.map((item: typeof itemsResult[0]) => ({
        id: item.id,
        preSaleId: item.preSaleId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discount: item.discount,
        discountType: item.discountType,
        discountPercentage: item.discountPercentage,
        product: {
          id: item.productId,
          code: item.productCode,
          name: item.productName,
          unit: item.productUnit,
          stock: item.productStock,
        },
      })),
    };

    return result;
  }

  /**
   * Create a new pre-sale with items
   */
  async create(preSaleData: CreatePreSaleData): Promise<PreSaleWithItems> {
    // Validate customer exists
    await this.validateCustomerExists(preSaleData.customerId);

    // Validate products exist and have sufficient stock
    await this.validateProductsAndStock(preSaleData.items);

    // Calculate totals and handle discount conversion
    const { subtotal, total, globalDiscount } = await this.calculateTotalsWithConversion(
      preSaleData.items,
      preSaleData.discount,
      preSaleData.discountType,
      preSaleData.discountPercentage
    );

    // Create pre-sale
    const preSaleResult = await db
      .insert(preSales)
      .values({
        customerId: preSaleData.customerId,
        status: preSaleData.status || 'draft',
        total: total.toString(),
        discount: globalDiscount.fixedValue.toString(),
        discountType: preSaleData.discountType || 'fixed',
        discountPercentage: globalDiscount.percentage.toString(),
        notes: preSaleData.notes || null,
      })
      .returning();

    const createdPreSale = preSaleResult[0];

    // Create pre-sale items with discount conversion
    const itemsToInsert = preSaleData.items.map(item => {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unitPrice);
      const lineSubtotal = quantity * unitPrice;

      // Calculate discount with conversion
      const itemDiscountType = item.discountType || 'fixed';
      const itemDiscountValue = itemDiscountType === 'percentage'
        ? (item.discountPercentage || '0')
        : (item.discount || '0');

      const discountCalc = calculateDiscountWithConversion(
        lineSubtotal,
        itemDiscountValue,
        itemDiscountType
      );

      const totalPrice = lineSubtotal - discountCalc.discountAmount;

      return {
        preSaleId: createdPreSale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice.toString(),
        discount: discountCalc.fixedValue.toString(),
        discountType: itemDiscountType,
        discountPercentage: discountCalc.percentage.toString(),
      };
    });

    await db.insert(preSaleItems).values(itemsToInsert);

    // Return the created pre-sale with items
    const result = await this.findById(createdPreSale.id);
    if (!result) {
      throw new Error('Failed to retrieve created pre-sale');
    }

    return result;
  }

  /**
   * Update an existing pre-sale
   */
  async update(id: string, preSaleData: UpdatePreSaleData): Promise<PreSaleWithItems> {
    // Check if pre-sale exists
    const existingPreSale = await this.findById(id);
    if (!existingPreSale) {
      throw new Error('Pre-sale not found');
    }

    // Validate customer if provided
    if (preSaleData.customerId) {
      await this.validateCustomerExists(preSaleData.customerId);
    }

    // Validate status transition if provided
    if (preSaleData.status) {
      this.validateStatusTransition(existingPreSale.status, preSaleData.status);
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Handle items update if provided
    if (preSaleData.items) {
      // Validate products and stock
      await this.validateProductsAndStock(preSaleData.items);

      // Delete existing items
      await db.delete(preSaleItems).where(eq(preSaleItems.preSaleId, id));

      // Insert new items with discount conversion
      const itemsToInsert = preSaleData.items.map(item => {
        const quantity = parseFloat(item.quantity);
        const unitPrice = parseFloat(item.unitPrice);
        const lineSubtotal = quantity * unitPrice;

        // Calculate discount with conversion
        const itemDiscountType = item.discountType || 'fixed';
        const itemDiscountValue = itemDiscountType === 'percentage'
          ? (item.discountPercentage || '0')
          : (item.discount || '0');

        const discountCalc = calculateDiscountWithConversion(
          lineSubtotal,
          itemDiscountValue,
          itemDiscountType
        );

        const totalPrice = lineSubtotal - discountCalc.discountAmount;

        return {
          preSaleId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: totalPrice.toString(),
          discount: discountCalc.fixedValue.toString(),
          discountType: itemDiscountType,
          discountPercentage: discountCalc.percentage.toString(),
        };
      });

      await db.insert(preSaleItems).values(itemsToInsert);

      // Recalculate totals with discount conversion
      const discountType = preSaleData.discountType || existingPreSale.discountType;
      const discountValue = preSaleData.discountType === 'percentage'
        ? preSaleData.discountPercentage
        : preSaleData.discount;

      const { subtotal, total, globalDiscount } = await this.calculateTotalsWithConversion(
        preSaleData.items,
        discountValue,
        discountType,
        preSaleData.discountPercentage
      );

      updateData.total = total.toString();
      updateData.discount = globalDiscount.fixedValue.toString();
      updateData.discountPercentage = globalDiscount.percentage.toString();
    }

    if (preSaleData.customerId !== undefined) {
      updateData.customerId = preSaleData.customerId;
    }

    if (preSaleData.status !== undefined) {
      updateData.status = preSaleData.status;
    }

    // Handle discount updates with conversion
    if (preSaleData.discount !== undefined || preSaleData.discountType !== undefined || preSaleData.discountPercentage !== undefined) {
      const newDiscountType = preSaleData.discountType || existingPreSale.discountType;
      const newDiscountValue = newDiscountType === 'percentage'
        ? (preSaleData.discountPercentage || existingPreSale.discountPercentage)
        : (preSaleData.discount || existingPreSale.discount);

      // Recalculate total if discount changed and no items update
      if (!preSaleData.items) {
        const currentItems = existingPreSale.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          discountType: item.discountType,
          discountPercentage: item.discountPercentage,
        }));

        const { subtotal, total, globalDiscount } = await this.calculateTotalsWithConversion(
          currentItems,
          newDiscountValue,
          newDiscountType,
          preSaleData.discountPercentage
        );

        updateData.total = total.toString();
        updateData.discount = globalDiscount.fixedValue.toString();
        updateData.discountType = newDiscountType;
        updateData.discountPercentage = globalDiscount.percentage.toString();
      } else {
        // If items are being updated, discount conversion is already handled above
        if (preSaleData.discountType !== undefined) {
          updateData.discountType = preSaleData.discountType;
        }
      }
    }

    if (preSaleData.notes !== undefined) {
      updateData.notes = preSaleData.notes;
    }



    // Update pre-sale
    await db
      .update(preSales)
      .set(updateData)
      .where(eq(preSales.id, id));

    // Return updated pre-sale
    const result = await this.findById(id);
    if (!result) {
      throw new Error('Failed to retrieve updated pre-sale');
    }

    return result;
  }

  /**
   * Delete a pre-sale and all its items
   */
  async delete(id: string): Promise<void> {
    // Check if pre-sale exists
    const existingPreSale = await this.findById(id);
    if (!existingPreSale) {
      throw new Error('Pre-sale not found');
    }

    // Delete pre-sale (items will be deleted automatically due to cascade)
    await db.delete(preSales).where(eq(preSales.id, id));
  }

  /**
   * Update pre-sale status
   */
  async updateStatus(id: string, status: PreSaleStatus): Promise<PreSale> {
    // Check if pre-sale exists
    const existingPreSale = await db
      .select()
      .from(preSales)
      .where(eq(preSales.id, id))
      .limit(1);

    if (existingPreSale.length === 0) {
      throw new Error('Pre-sale not found');
    }

    // Validate status transition
    this.validateStatusTransition(existingPreSale[0].status, status);

    // Use transaction to ensure atomicity when converting to "converted" status
    if (status === 'converted' && existingPreSale[0].status !== 'converted') {
      return await db.transaction(async (tx) => {
        // First, validate and reduce stock
        await this.processStockReductionForSaleInTransaction(id, tx);

        // Then update status
        const result = await tx
          .update(preSales)
          .set({
            status,
            updatedAt: new Date(),
          })
          .where(eq(preSales.id, id))
          .returning();

        return result[0];
      });
    } else {
      // For other status changes, no transaction needed
      const result = await db
        .update(preSales)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(preSales.id, id))
        .returning();

      return result[0];
    }
  }

  /**
   * Calculate totals for pre-sale items using calculation utilities
   */
  async calculateTotals(items: CreatePreSaleItemData[] | UpdatePreSaleItemData[], globalDiscount: string = '0'): Promise<{ subtotal: number; total: number }> {
    // Convert items to calculation format
    const calculationItems: PreSaleItemCalculation[] = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || '0',
    }));

    // Use calculation utility
    const result = calculatePreSaleTotals(calculationItems, globalDiscount, 'fixed');

    return {
      subtotal: roundMoney(result.subtotal),
      total: roundMoney(result.total),
    };
  }

  /**
   * Calculate totals with discount type conversion
   */
  async calculateTotalsWithConversion(
    items: CreatePreSaleItemData[] | UpdatePreSaleItemData[],
    discountValue?: string,
    discountType?: DiscountType,
    discountPercentage?: string
  ): Promise<{
    subtotal: number;
    total: number;
    globalDiscount: { fixedValue: number; percentage: number; discountAmount: number }
  }> {
    // Calculate subtotal from items (after item-level discounts)
    let subtotal = 0;

    for (const item of items) {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unitPrice);
      const lineSubtotal = quantity * unitPrice;

      // Handle item-level discount
      const itemDiscountType = item.discountType || 'fixed';
      const itemDiscountValue = itemDiscountType === 'percentage'
        ? (item.discountPercentage || '0')
        : (item.discount || '0');

      const itemDiscount = calculateDiscountWithConversion(
        lineSubtotal,
        itemDiscountValue,
        itemDiscountType
      );

      subtotal += (lineSubtotal - itemDiscount.discountAmount);
    }

    // Apply global discount with conversion
    const globalDiscountType = discountType || 'fixed';
    const globalDiscountValue = globalDiscountType === 'percentage'
      ? (discountPercentage || '0')
      : (discountValue || '0');

    const globalDiscount = calculateDiscountWithConversion(
      subtotal,
      globalDiscountValue,
      globalDiscountType
    );

    const total = Math.max(0, subtotal - globalDiscount.discountAmount);

    return {
      subtotal: roundMoney(subtotal),
      total: roundMoney(total),
      globalDiscount,
    };
  }

  /**
   * Count total pre-sales with filters
   */
  async count(filters: PreSalesFilters = {}): Promise<number> {
    const { customerId, status, customerName, dateFrom, dateTo, search } = filters;

    const conditions = [];

    if (customerId) {
      conditions.push(eq(preSales.customerId, customerId));
    }

    if (status) {
      if (Array.isArray(status)) {
        conditions.push(inArray(preSales.status, status));
      } else {
        conditions.push(eq(preSales.status, status));
      }
    }

    if (dateFrom) {
      conditions.push(sql`${preSales.createdAt} >= ${new Date(dateFrom)}`);
    }

    if (dateTo) {
      conditions.push(sql`${preSales.createdAt} <= ${new Date(dateTo)}`);
    }

    if (customerName || search) {
      const searchTerm = customerName || search;
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${customers} 
          WHERE ${customers.id} = ${preSales.customerId} 
          AND ${ilike(customers.name, `%${searchTerm}%`)}
        )`
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(preSales)
      .where(whereCondition);

    return result[0].count;
  }

  /**
   * Private method to validate customer exists
   */
  private async validateCustomerExists(customerId: string): Promise<void> {
    const customer = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customer.length === 0) {
      throw new Error('Customer not found');
    }
  }

  /**
   * Private method to validate products exist and have sufficient stock using calculation utilities
   */
  private async validateProductsAndStock(items: CreatePreSaleItemData[] | UpdatePreSaleItemData[]): Promise<void> {
    // Convert items to calculation format
    const calculationItems: PreSaleItemCalculation[] = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || '0',
    }));

    // Use stock validation utility
    const validation = await validateStockForPreSale(calculationItems);

    if (!validation.isValid) {
      throw new Error(validation.errors.join('; '));
    }
  }

  /**
   * Private method to validate status transitions
   */
  private validateStatusTransition(currentStatus: PreSaleStatus, newStatus: PreSaleStatus): void {
    // Allow same status (no transition)
    if (currentStatus === newStatus) {
      return;
    }

    const validTransitions: Record<PreSaleStatus, PreSaleStatus[]> = {
      draft: ['pending', 'cancelled'],
      pending: ['approved', 'cancelled', 'converted'], // Agora permite conversão direta de pending
      approved: ['converted', 'cancelled'],
      cancelled: [], // Cannot transition from cancelled
      converted: [], // Cannot transition from converted
    };

    const allowedTransitions = validTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Private method to process automatic stock reduction when a sale is completed
   */
  private async processStockReductionForSale(preSaleId: string): Promise<void> {
    // Get pre-sale with items
    const preSale = await this.findById(preSaleId);
    if (!preSale) {
      throw new Error('Pre-sale not found for stock reduction');
    }

    // Validate stock availability before processing
    for (const item of preSale.items) {
      const quantityToReduce = parseFloat(item.quantity);

      if (item.product.stock < quantityToReduce) {
        throw new Error(
          `Insufficient stock for product ${item.product.name} (${item.product.code}). ` +
          `Available: ${item.product.stock}, Required: ${quantityToReduce}`
        );
      }
    }

    // Process stock reduction for each item
    for (const item of preSale.items) {
      const quantityToReduce = parseFloat(item.quantity);

      try {
        await stockAdjustmentService.adjustStock(
          item.productId,
          {
            adjustmentType: 'remove',
            quantity: quantityToReduce,
            reason: `Venda finalizada - Pré-venda #${preSaleId.substring(0, 8)}`
          },
          'system', // userId - using system for automatic adjustments
          'Sistema de Vendas', // userName
          undefined, // ipAddress
          'Automatic Stock Reduction' // userAgent
        );
      } catch (error) {
        console.error(`Failed to reduce stock for product ${item.productId}:`, error);
        throw new Error(
          `Failed to reduce stock for product ${item.product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Private method to process automatic stock reduction within a transaction
   */
  private async processStockReductionForSaleInTransaction(preSaleId: string, tx: any): Promise<void> {
    // Get pre-sale with items (using the transaction)
    const preSaleResult = await tx
      .select({
        id: preSales.id,
        customerId: preSales.customerId,
        status: preSales.status,
        total: preSales.total,
        discount: preSales.discount,
        discountType: preSales.discountType,
        discountPercentage: preSales.discountPercentage,
        notes: preSales.notes,
        createdAt: preSales.createdAt,
        updatedAt: preSales.updatedAt,
      })
      .from(preSales)
      .where(eq(preSales.id, preSaleId))
      .limit(1);

    if (preSaleResult.length === 0) {
      throw new Error('Pre-sale not found for stock reduction');
    }

    // Get pre-sale items with product data (using the transaction)
    const itemsResult = await tx
      .select({
        id: preSaleItems.id,
        preSaleId: preSaleItems.preSaleId,
        productId: preSaleItems.productId,
        quantity: preSaleItems.quantity,
        unitPrice: preSaleItems.unitPrice,
        totalPrice: preSaleItems.totalPrice,
        discount: preSaleItems.discount,
        discountType: preSaleItems.discountType,
        discountPercentage: preSaleItems.discountPercentage,
        productCode: products.code,
        productName: products.name,
        productUnit: products.unit,
        productStock: products.stock,
      })
      .from(preSaleItems)
      .innerJoin(products, eq(preSaleItems.productId, products.id))
      .where(eq(preSaleItems.preSaleId, preSaleId));

    // Validate stock availability before processing
    for (const item of itemsResult) {
      const quantityToReduce = parseFloat(item.quantity);

      if (item.productStock < quantityToReduce) {
        throw new Error(
          `Insufficient stock for product ${item.productName} (${item.productCode}). ` +
          `Available: ${item.productStock}, Required: ${quantityToReduce}`
        );
      }
    }

    // Process stock reduction for each item within the transaction
    for (const item of itemsResult) {
      const quantityToReduce = parseFloat(item.quantity);
      const newStock = item.productStock - quantityToReduce;

      try {
        // Update product stock directly in the transaction
        await tx
          .update(products)
          .set({
            stock: newStock,
            updatedAt: new Date()
          })
          .where(eq(products.id, item.productId));

        // Create stock adjustment record in the transaction
        await tx
          .insert(stockAdjustments)
          .values({
            productId: item.productId,
            adjustmentType: 'remove',
            quantity: quantityToReduce,
            previousStock: item.productStock,
            newStock: newStock,
            reason: `Venda finalizada - Pré-venda #${preSaleId.substring(0, 8)}`,
            userId: null, // system adjustment
            userName: 'Sistema de Vendas',
            ipAddress: null,
            userAgent: 'Automatic Stock Reduction'
          });

      } catch (error) {
        console.error(`Failed to reduce stock for product ${item.productId}:`, error);
        throw new Error(
          `Failed to reduce stock for product ${item.productName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }
}

// Export singleton instance
export const preSalesService = new PreSalesService();