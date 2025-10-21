import { z } from 'zod';

/**
 * Schema for audit log query filters
 */
export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  userId: z.string().uuid().optional(),
  action: z.enum(['login', 'logout', 'create', 'update', 'delete', 'view']).optional(),
  resource: z.string().optional(),
  resourceId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

/**
 * Schema for user ID parameter
 */
export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID format')
});

/**
 * TypeScript types inferred from schemas
 */
export type AuditLogQueryParams = z.infer<typeof auditLogQuerySchema>;
export type UserIdParams = z.infer<typeof userIdParamSchema>;
