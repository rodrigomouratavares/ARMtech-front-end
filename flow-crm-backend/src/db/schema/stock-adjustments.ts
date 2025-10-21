import { pgTable, uuid, varchar, integer, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { products } from './products';
import { users } from './users';

/**
 * Stock adjustment types enum
 */
export const stockAdjustmentTypeEnum = pgEnum('stock_adjustment_type', [
    'add',
    'remove'
]);

/**
 * Stock Adjustments table schema
 * Stores all stock adjustment operations for inventory tracking
 */
export const stockAdjustments = pgTable('stock_adjustments', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').references(() => products.id).notNull(),
    adjustmentType: stockAdjustmentTypeEnum('adjustment_type').notNull(),
    quantity: integer('quantity').notNull(),
    previousStock: integer('previous_stock').notNull(),
    newStock: integer('new_stock').notNull(),
    reason: text('reason').notNull(),
    userId: uuid('user_id').references(() => users.id),
    userName: varchar('user_name', { length: 255 }).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull()
});