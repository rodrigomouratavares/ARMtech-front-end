import { eq, and, desc, gte, lte, sql, ilike } from 'drizzle-orm';
import { db } from '../db/connection';
import { stockAdjustments, stockAdjustmentTypeEnum } from '../db/schema/stock-adjustments';
import { products } from '../db/schema/products';
import { productService } from './products.service';
import { auditLogService } from './audit-logs.service';
import { BaseFilters } from '../types/common.types';

/**
 * Stock adjustment types
 */
export type StockAdjustmentType = 'add' | 'remove';

/**
 * Stock adjustment entity interface
 */
export interface StockAdjustment {
    id: string;
    productId: string;
    productCode: string;
    productName: string;
    adjustmentType: StockAdjustmentType;
    quantity: number;
    previousStock: number;
    newStock: number;
    reason: string;
    userId: string | null;
    userName: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
}

/**
 * Stock adjustment request data interface
 */
export interface StockAdjustmentData {
    adjustmentType: StockAdjustmentType;
    quantity: number;
    reason: string;
}

/**
 * Stock adjustment result interface
 */
export interface StockAdjustmentResult {
    id: string;
    code: string;
    name: string;
    stock: number;
    previousStock: number;
    adjustment: {
        id: string;
        type: StockAdjustmentType;
        quantity: number;
        reason: string;
        createdAt: Date;
    };
}

/**
 * Stock history filters interface
 */
export interface StockHistoryFilters extends BaseFilters {
    productId?: string;
    productCode?: string;
    adjustmentType?: StockAdjustmentType;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
}

/**
 * Stock Adjustment service class containing all stock adjustment-related business logic
 */
export class StockAdjustmentService {
    /**
     * Adjust product stock with transaction support and audit logging
     */
    async adjustStock(
        productId: string,
        data: StockAdjustmentData,
        userId?: string,
        userName: string = 'System',
        ipAddress?: string,
        userAgent?: string
    ): Promise<StockAdjustmentResult> {
        // Validate adjustment data
        this.validateAdjustmentData(data);

        // Start transaction
        return await db.transaction(async (tx) => {
            // Get current product
            const product = await productService.findById(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            const previousStock = product.stock;
            const adjustmentAmount = data.adjustmentType === 'add' ? data.quantity : -data.quantity;
            const newStock = previousStock + adjustmentAmount;

            // Validate stock doesn't go negative
            if (newStock < 0) {
                throw new Error(`Insufficient stock for this operation. Current stock: ${previousStock}, requested removal: ${data.quantity}`);
            }

            // Update product stock
            const updatedProduct = await productService.adjustStock(productId, adjustmentAmount);

            // Create stock adjustment record
            const adjustmentRecord = await tx
                .insert(stockAdjustments)
                .values({
                    productId,
                    adjustmentType: data.adjustmentType,
                    quantity: data.quantity,
                    previousStock,
                    newStock,
                    reason: data.reason,
                    userId: userId || null,
                    userName,
                    ipAddress: ipAddress || null,
                    userAgent: userAgent || null
                })
                .returning();

            // Log audit entry
            try {
                await auditLogService.logUpdate(
                    userId || 'system',
                    userName,
                    'product_stock',
                    productId,
                    `Stock ${data.adjustmentType}: ${data.quantity} units. Previous: ${previousStock}, New: ${newStock}. Reason: ${data.reason}`,
                    ipAddress,
                    userAgent
                );
            } catch (auditError) {
                console.error('Failed to create audit log:', auditError);
                // Don't fail the transaction for audit errors, but log them
            }

            return {
                id: updatedProduct.id,
                code: updatedProduct.code,
                name: updatedProduct.name,
                stock: updatedProduct.stock,
                previousStock,
                adjustment: {
                    id: adjustmentRecord[0].id,
                    type: data.adjustmentType,
                    quantity: data.quantity,
                    reason: data.reason,
                    createdAt: adjustmentRecord[0].createdAt
                }
            };
        });
    }

    /**
     * Get stock adjustment history with filtering and pagination
     */
    async getAdjustmentHistory(filters: StockHistoryFilters = {}): Promise<StockAdjustment[]> {
        const {
            page = 1,
            limit = 50,
            productId,
            productCode,
            adjustmentType,
            startDate,
            endDate,
            userId
        } = filters;

        // Build where conditions for stock adjustments table
        const adjustmentConditions = [];

        if (productId) {
            adjustmentConditions.push(eq(stockAdjustments.productId, productId));
        }

        if (adjustmentType) {
            adjustmentConditions.push(eq(stockAdjustments.adjustmentType, adjustmentType));
        }

        if (startDate) {
            adjustmentConditions.push(gte(stockAdjustments.createdAt, startDate));
        }

        if (endDate) {
            adjustmentConditions.push(lte(stockAdjustments.createdAt, endDate));
        }

        if (userId) {
            adjustmentConditions.push(eq(stockAdjustments.userId, userId));
        }

        // Build where conditions for products table
        const productConditions = [];
        if (productCode) {
            productConditions.push(ilike(products.code, `%${productCode}%`));
        }

        // Combine all conditions
        const allConditions = [...adjustmentConditions, ...productConditions];
        const whereCondition = allConditions.length > 0 ? and(...allConditions) : undefined;

        // Apply pagination
        const offset = (page - 1) * limit;

        // Build and execute query
        const baseQuery = db
            .select({
                id: stockAdjustments.id,
                productId: stockAdjustments.productId,
                productCode: products.code,
                productName: products.name,
                adjustmentType: stockAdjustments.adjustmentType,
                quantity: stockAdjustments.quantity,
                previousStock: stockAdjustments.previousStock,
                newStock: stockAdjustments.newStock,
                reason: stockAdjustments.reason,
                userId: stockAdjustments.userId,
                userName: stockAdjustments.userName,
                ipAddress: stockAdjustments.ipAddress,
                userAgent: stockAdjustments.userAgent,
                createdAt: stockAdjustments.createdAt
            })
            .from(stockAdjustments)
            .innerJoin(products, eq(stockAdjustments.productId, products.id))
            .orderBy(desc(stockAdjustments.createdAt))
            .limit(limit)
            .offset(offset);

        const result = whereCondition ? await baseQuery.where(whereCondition) : await baseQuery;

        return result.map(row => ({
            id: row.id,
            productId: row.productId,
            productCode: row.productCode,
            productName: row.productName,
            adjustmentType: row.adjustmentType as StockAdjustmentType,
            quantity: row.quantity,
            previousStock: row.previousStock,
            newStock: row.newStock,
            reason: row.reason,
            userId: row.userId,
            userName: row.userName,
            ipAddress: row.ipAddress,
            userAgent: row.userAgent,
            createdAt: row.createdAt
        }));
    }

    /**
     * Count stock adjustment history with filters
     */
    async countAdjustmentHistory(filters: StockHistoryFilters = {}): Promise<number> {
        const {
            productId,
            productCode,
            adjustmentType,
            startDate,
            endDate,
            userId
        } = filters;

        // Build where conditions for stock adjustments table
        const adjustmentConditions = [];

        if (productId) {
            adjustmentConditions.push(eq(stockAdjustments.productId, productId));
        }

        if (adjustmentType) {
            adjustmentConditions.push(eq(stockAdjustments.adjustmentType, adjustmentType));
        }

        if (startDate) {
            adjustmentConditions.push(gte(stockAdjustments.createdAt, startDate));
        }

        if (endDate) {
            adjustmentConditions.push(lte(stockAdjustments.createdAt, endDate));
        }

        if (userId) {
            adjustmentConditions.push(eq(stockAdjustments.userId, userId));
        }

        // Build where conditions for products table
        const productConditions = [];
        if (productCode) {
            productConditions.push(ilike(products.code, `%${productCode}%`));
        }

        // Combine all conditions
        const allConditions = [...adjustmentConditions, ...productConditions];
        const whereCondition = allConditions.length > 0 ? and(...allConditions) : undefined;

        // Build count query
        const baseQuery = db
            .select({ count: sql<number>`count(*)::int` })
            .from(stockAdjustments);

        // Add join if we need to filter by product code
        const queryWithJoin = productCode
            ? baseQuery.innerJoin(products, eq(stockAdjustments.productId, products.id))
            : baseQuery;

        const result = whereCondition ? await queryWithJoin.where(whereCondition) : await queryWithJoin;
        return result[0]?.count || 0;
    }

    /**
     * Get stock adjustments for a specific product
     */
    async getProductAdjustmentHistory(
        productId: string,
        limit: number = 50
    ): Promise<StockAdjustment[]> {
        return this.getAdjustmentHistory({ productId, limit });
    }

    /**
     * Get recent stock adjustments
     */
    async getRecentAdjustments(limit: number = 50): Promise<StockAdjustment[]> {
        return this.getAdjustmentHistory({ limit });
    }

    /**
     * Private method to validate adjustment data
     */
    private validateAdjustmentData(data: StockAdjustmentData): void {
        if (!data.adjustmentType || !['add', 'remove'].includes(data.adjustmentType)) {
            throw new Error('Invalid adjustment type. Must be "add" or "remove"');
        }

        if (!data.quantity || data.quantity <= 0) {
            throw new Error('Quantity must be a positive number');
        }

        if (!data.reason || data.reason.trim().length === 0) {
            throw new Error('Reason is required for stock adjustments');
        }

        if (data.reason.length > 500) {
            throw new Error('Reason must be 500 characters or less');
        }
    }
}

// Export singleton instance
export const stockAdjustmentService = new StockAdjustmentService();