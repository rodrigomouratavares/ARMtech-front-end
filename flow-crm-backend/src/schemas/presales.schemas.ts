import { z, ZodError } from 'zod';
import { PreSaleStatus } from '../types/common.types';

/**
 * Zod validation schemas for pre-sales
 */

// Pre-sale status enum validation
const preSaleStatusSchema = z.enum(['draft', 'pending', 'approved', 'cancelled', 'converted'], {
  message: 'Status must be one of: draft, pending, approved, cancelled, converted'
});

// Discount type enum validation
const discountTypeSchema = z.enum(['fixed', 'percentage'], {
  message: 'Discount type must be either fixed or percentage'
});

// Decimal string validation for monetary values
const decimalStringSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal number with up to 2 decimal places')
  .transform(val => val);

// Percentage decimal string validation (up to 2 decimal places, max 100)
const percentageStringSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal number with up to 2 decimal places')
  .refine(val => parseFloat(val) >= 0 && parseFloat(val) <= 100, 'Percentage must be between 0 and 100')
  .transform(val => val);

// Quantity decimal string validation (up to 3 decimal places)
const quantityStringSchema = z
  .string()
  .regex(/^\d+(\.\d{1,3})?$/, 'Must be a valid decimal number with up to 3 decimal places')
  .refine(val => parseFloat(val) > 0, 'Quantity must be greater than 0')
  .transform(val => val);

// UUID validation
const uuidSchema = z.string().uuid('Invalid UUID format');

// Pre-sale item schema for creation
const createPreSaleItemSchema = z.object({
  productId: uuidSchema,
  quantity: quantityStringSchema,
  unitPrice: decimalStringSchema.refine(val => parseFloat(val) >= 0, 'Unit price must be non-negative'),
  discount: decimalStringSchema
    .optional()
    .default('0')
    .refine(val => parseFloat(val) >= 0, 'Discount must be non-negative'),
  discountType: discountTypeSchema.optional().default('fixed'),
  discountPercentage: percentageStringSchema.optional().default('0')
}).strict();

// Pre-sale item schema for updates
const updatePreSaleItemSchema = z.object({
  id: uuidSchema.optional(), // If provided, update existing item; if not, create new item
  productId: uuidSchema,
  quantity: quantityStringSchema,
  unitPrice: decimalStringSchema.refine(val => parseFloat(val) >= 0, 'Unit price must be non-negative'),
  discount: decimalStringSchema
    .optional()
    .default('0')
    .refine(val => parseFloat(val) >= 0, 'Discount must be non-negative'),
  discountType: discountTypeSchema.optional().default('fixed'),
  discountPercentage: percentageStringSchema.optional().default('0')
}).strict();

// Create pre-sale schema
export const createPreSaleSchema = z.object({
  customerId: uuidSchema,
  status: preSaleStatusSchema.optional().default('pending'), // Sempre inicia como pending
  discount: decimalStringSchema
    .optional()
    .default('0')
    .refine(val => parseFloat(val) >= 0, 'Discount must be non-negative'),
  discountType: discountTypeSchema.optional().default('fixed'),
  discountPercentage: percentageStringSchema.optional().default('0'),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim()
    .optional()
    .nullable()
    .transform(notes => notes === '' ? null : notes),
  items: z
    .array(createPreSaleItemSchema)
    .min(1, 'At least one item is required')
    .max(100, 'Maximum 100 items allowed per pre-sale')
}).strict();

// Update pre-sale schema
export const updatePreSaleSchema = z.object({
  customerId: uuidSchema.optional(),
  status: preSaleStatusSchema.optional(),
  discount: decimalStringSchema
    .optional()
    .refine(val => val === undefined || parseFloat(val) >= 0, 'Discount must be non-negative'),
  discountType: discountTypeSchema.optional(),
  discountPercentage: percentageStringSchema.optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim()
    .optional()
    .nullable()
    .transform(notes => notes === '' ? null : notes),
  items: z
    .array(updatePreSaleItemSchema)
    .min(1, 'At least one item is required')
    .max(100, 'Maximum 100 items allowed per pre-sale')
    .optional()
}).strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  );

// Update pre-sale status schema
export const updatePreSaleStatusSchema = z.object({
  status: preSaleStatusSchema
}).strict();

// Pre-sale query filters schema
export const preSaleFiltersSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1)
    .refine(val => val >= 1, 'Page must be greater than 0'),

  limit: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 50)
    .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),

  sortBy: z
    .enum(['createdAt', 'total', 'status'], {
      message: 'Sort field must be createdAt, total, or status'
    })
    .optional()
    .default('createdAt'),

  sortOrder: z
    .enum(['asc', 'desc'], {
      message: 'Sort order must be asc or desc'
    })
    .optional()
    .default('desc'),

  customerId: uuidSchema.optional(),

  status: z
    .union([
      preSaleStatusSchema,
      z.array(preSaleStatusSchema).min(1, 'At least one status must be provided')
    ])
    .optional(),

  customerName: z
    .string()
    .trim()
    .optional()
    .transform(val => {
      // Treat empty strings, 'string', 'undefined', 'null' as undefined
      if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
        return undefined;
      }
      return val;
    })
    .refine(val => !val || val.length <= 255, 'Customer name filter must be less than 255 characters'),

  dateFrom: z
    .string()
    .trim()
    .optional()
    .transform(val => {
      // Treat empty strings, 'string', 'undefined', 'null' as undefined
      if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
        return undefined;
      }
      return val;
    })
    .refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), 'Date must be in YYYY-MM-DD format')
    .refine(val => !val || !isNaN(Date.parse(val)), 'Invalid date format'),

  dateTo: z
    .string()
    .trim()
    .optional()
    .transform(val => {
      // Treat empty strings, 'string', 'undefined', 'null' as undefined
      if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
        return undefined;
      }
      return val;
    })
    .refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), 'Date must be in YYYY-MM-DD format')
    .refine(val => !val || !isNaN(Date.parse(val)), 'Invalid date format'),

  search: z
    .string()
    .trim()
    .optional()
    .transform(val => {
      // Treat empty strings, 'string', 'undefined', 'null' as undefined
      if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
        return undefined;
      }
      return val;
    })
    .refine(val => !val || val.length <= 255, 'Search term must be less than 255 characters')
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return new Date(data.dateFrom) <= new Date(data.dateTo);
    }
    return true;
  },
  'dateFrom must be before or equal to dateTo'
);

// Pre-sale ID parameter schema
export const preSaleIdSchema = z.object({
  id: uuidSchema
});

// Pre-sale item response schema
export const preSaleItemResponseSchema = z.object({
  id: z.string().uuid(),
  preSaleId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.string(),
  unitPrice: z.string(),
  totalPrice: z.string(),
  discount: z.string(),
  discountType: discountTypeSchema,
  discountPercentage: z.string(),
  product: z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    unit: z.string(),
    stock: z.number()
  })
});

// Customer info schema for pre-sale response
export const customerInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  cpf: z.string()
});

// Pre-sale response schema
export const preSaleResponseSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  status: preSaleStatusSchema,
  total: z.string(),
  discount: z.string(),
  discountType: discountTypeSchema,
  discountPercentage: z.string(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Pre-sale with items response schema
export const preSaleWithItemsResponseSchema = preSaleResponseSchema.extend({
  customer: customerInfoSchema,
  items: z.array(preSaleItemResponseSchema)
});

// Paginated pre-sales response schema
export const paginatedPreSalesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(preSaleResponseSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  }),
  message: z.string().optional(),
  timestamp: z.string()
});

// Success response schema
export const preSaleSuccessResponseSchema = z.object({
  success: z.boolean(),
  data: preSaleWithItemsResponseSchema,
  message: z.string().optional(),
  timestamp: z.string()
});

// Error response schema
export const preSaleErrorResponseSchema = z.object({
  success: z.boolean(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }),
  timestamp: z.string(),
  path: z.string().optional()
});

// Validation error details schema
export const validationErrorDetailsSchema = z.object({
  field: z.string(),
  message: z.string(),
  value: z.any().optional()
});

// Type exports
export type CreatePreSaleRequest = z.infer<typeof createPreSaleSchema>;
export type UpdatePreSaleRequest = z.infer<typeof updatePreSaleSchema>;
export type UpdatePreSaleStatusRequest = z.infer<typeof updatePreSaleStatusSchema>;
export type PreSaleFilters = z.infer<typeof preSaleFiltersSchema>;
export type PreSaleIdParams = z.infer<typeof preSaleIdSchema>;
export type PreSaleResponse = z.infer<typeof preSaleResponseSchema>;
export type PreSaleWithItemsResponse = z.infer<typeof preSaleWithItemsResponseSchema>;
export type PreSaleItemResponse = z.infer<typeof preSaleItemResponseSchema>;
export type CustomerInfo = z.infer<typeof customerInfoSchema>;
export type PaginatedPreSalesResponse = z.infer<typeof paginatedPreSalesResponseSchema>;
export type PreSaleSuccessResponse = z.infer<typeof preSaleSuccessResponseSchema>;
export type PreSaleErrorResponse = z.infer<typeof preSaleErrorResponseSchema>;
export type ValidationErrorDetails = z.infer<typeof validationErrorDetailsSchema>;

// Status transition validation
export const validateStatusTransition = (currentStatus: PreSaleStatus, newStatus: PreSaleStatus): boolean => {
  const validTransitions: Record<PreSaleStatus, PreSaleStatus[]> = {
    draft: ['pending', 'cancelled'],
    pending: ['approved', 'cancelled', 'converted'], // Agora permite conversão direta de pending
    approved: ['converted', 'cancelled'],
    cancelled: [], // Cannot transition from cancelled
    converted: [], // Cannot transition from converted
  };

  const allowedTransitions = validTransitions[currentStatus];
  return allowedTransitions.includes(newStatus);
};

// Custom validation functions
export const validateCustomerReference = async (customerId: string): Promise<boolean> => {
  // This would typically check against the database
  // Implementation would be in the service layer
  return true; // Placeholder
};

export const validateProductReference = async (productId: string): Promise<boolean> => {
  // This would typically check against the database
  // Implementation would be in the service layer
  return true; // Placeholder
};

export const validateProductStock = async (productId: string, quantity: string): Promise<boolean> => {
  // This would typically check against the database
  // Implementation would be in the service layer
  return true; // Placeholder
};

// Schema validation helpers
export const validateCreatePreSale = (data: unknown) => {
  return createPreSaleSchema.safeParse(data);
};

export const validateUpdatePreSale = (data: unknown) => {
  return updatePreSaleSchema.safeParse(data);
};

export const validateUpdatePreSaleStatus = (data: unknown) => {
  return updatePreSaleStatusSchema.safeParse(data);
};

export const validatePreSaleFilters = (data: unknown) => {
  return preSaleFiltersSchema.safeParse(data);
};

export const validatePreSaleId = (data: unknown) => {
  return preSaleIdSchema.safeParse(data);
};

// Error message helpers
export const getValidationErrorMessage = (error: ZodError): string => {
  const firstError = error.issues[0];
  return firstError?.message || 'Validation failed';
};

export const getValidationErrorDetails = (error: ZodError): ValidationErrorDetails[] => {
  return error.issues.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    value: err.code === 'invalid_type' ? undefined : err.input
  }));
};

// Business logic validation helpers
export const validatePreSaleBusinessRules = (data: CreatePreSaleRequest | UpdatePreSaleRequest): string[] => {
  const errors: string[] = [];

  // Validate items if present
  if ('items' in data && data.items) {
    data.items.forEach((item, index) => {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unitPrice);
      const discount = parseFloat(item.discount || '0');

      // Check if discount exceeds line total
      const lineTotal = quantity * unitPrice;
      if (discount > lineTotal) {
        errors.push(`Item ${index + 1}: Discount cannot exceed line total`);
      }
    });
  }

  // Validate global discount if present
  if ('discount' in data && data.discount) {
    const globalDiscount = parseFloat(data.discount);
    if (globalDiscount < 0) {
      errors.push('Global discount cannot be negative');
    }
  }

  return errors;
};