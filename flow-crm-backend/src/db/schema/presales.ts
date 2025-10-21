import { pgTable, uuid, decimal, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { products } from './products';
import { paymentMethods } from './payment-methods';

export const presaleStatusEnum = pgEnum('presale_status', ['draft', 'pending', 'approved', 'cancelled', 'converted']);
export const discountTypeEnum = pgEnum('discount_type', ['fixed', 'percentage']);

export const preSales = pgTable('presales', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
  status: presaleStatusEnum('status').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0').notNull(),
  discountType: discountTypeEnum('discount_type').default('fixed').notNull(),
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).default('0').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const preSaleItems = pgTable('presale_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  preSaleId: uuid('presale_id').references(() => preSales.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0').notNull(),
  discountType: discountTypeEnum('discount_type').default('fixed').notNull(),
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).default('0').notNull()
});