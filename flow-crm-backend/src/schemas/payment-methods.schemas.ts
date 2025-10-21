import { z } from 'zod';

/**
 * Schema for creating a payment method
 */
export const createPaymentMethodSchema = z.object({
  description: z.string()
    .min(2, 'Description must be at least 2 characters long')
    .max(255, 'Description must not exceed 255 characters')
    .trim(),
  isActive: z.boolean().optional().default(true)
});

/**
 * Schema for updating a payment method
 */
export const updatePaymentMethodSchema = z.object({
  description: z.string()
    .min(2, 'Description must be at least 2 characters long')
    .max(255, 'Description must not exceed 255 characters')
    .trim()
    .optional(),
  isActive: z.boolean().optional()
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

/**
 * Schema for payment method ID parameter
 */
export const paymentMethodIdSchema = z.object({
  id: z.string().uuid('Invalid payment method ID format')
});

/**
 * Schema for payment method query filters
 */
export const paymentMethodQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  sortBy: z.enum(['code', 'description', 'createdAt']).optional().default('description'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional()
});

/**
 * TypeScript types inferred from schemas
 */
export type CreatePaymentMethodRequest = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodRequest = z.infer<typeof updatePaymentMethodSchema>;
export type PaymentMethodIdParams = z.infer<typeof paymentMethodIdSchema>;
export type PaymentMethodQueryParams = z.infer<typeof paymentMethodQuerySchema>;
