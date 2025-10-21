import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Audit action types enum
 */
export const auditActionEnum = pgEnum('audit_action', [
  'login',
  'logout',
  'create',
  'update',
  'delete',
  'view'
]);

/**
 * Audit Logs table schema
 * Stores all important system actions for security and compliance
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  userName: varchar('user_name', { length: 255 }).notNull(),
  action: auditActionEnum('action').notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
