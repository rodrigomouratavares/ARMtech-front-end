import { z, ZodError } from 'zod';

/**
 * Zod validation schemas for products
 */

// Price validation function for Zod
const priceValidation = (price: string) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice >= 0;
};

// Product code validation function
const productCodeValidation = (code: string) => {
  // Support both automatic PROD format (PROD + 7 digits) and legacy alphanumeric codes
  // When code is manually provided, it must follow one of these formats:
  // 1. PROD format: PROD followed by exactly 7 digits (e.g., PROD0000001)
  // 2. Legacy format: alphanumeric with hyphens/underscores (for backward compatibility)
  const prodFormatRegex = /^PROD\d{7}$/;
  const legacyFormatRegex = /^[A-Z0-9_-]+$/i;

  return prodFormatRegex.test(code) || legacyFormatRegex.test(code);
};

// Base product schema with common fields
const baseProductSchema = {
  code: z
    .string()
    .min(1, 'Product code is required')
    .max(50, 'Product code must be less than 50 characters')
    .trim()
    .transform(code => code.toUpperCase())
    .refine(productCodeValidation, 'Product code must be in PROD format (PROD + 7 digits) or contain only letters, numbers, hyphens, and underscores'),

  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters')
    .trim()
    .transform(name => name.replace(/\s+/g, ' ')), // Normalize whitespace

  unit: z
    .string()
    .min(1, 'Unit is required')
    .max(20, 'Unit must be less than 20 characters')
    .trim(),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .nullable()
    .transform(desc => desc === '' ? null : desc),

  stock: z
    .number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
    .optional()
    .default(0),

  purchasePrice: z
    .string()
    .min(1, 'Purchase price is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Purchase price must be a valid decimal number with up to 2 decimal places')
    .refine(priceValidation, 'Purchase price must be a valid positive number'),

  salePrice: z
    .string()
    .min(1, 'Sale price is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Sale price must be a valid decimal number with up to 2 decimal places')
    .refine(priceValidation, 'Sale price must be a valid positive number'),

  saleType: z
    .string()
    .min(1, 'Sale type is required')
    .max(50, 'Sale type must be less than 50 characters')
    .trim()
};

// Create product schema
export const createProductSchema = z.object({
  code: baseProductSchema.code.optional(), // Code is optional - will be auto-generated if not provided
  name: baseProductSchema.name,
  unit: baseProductSchema.unit,
  description: baseProductSchema.description,
  stock: baseProductSchema.stock,
  purchasePrice: baseProductSchema.purchasePrice,
  salePrice: baseProductSchema.salePrice,
  saleType: baseProductSchema.saleType
}).strict() // Prevent additional properties
  .refine(
    (data) => {
      const purchasePrice = parseFloat(data.purchasePrice);
      const salePrice = parseFloat(data.salePrice);
      return salePrice >= purchasePrice;
    },
    {
      message: 'Sale price should not be lower than purchase price',
      path: ['salePrice']
    }
  );

// Update product schema - code field is excluded to prevent modifications after creation
export const updateProductSchema = z.object({
  name: baseProductSchema.name.optional(),
  unit: baseProductSchema.unit.optional(),
  description: baseProductSchema.description,
  stock: baseProductSchema.stock.optional(),
  purchasePrice: baseProductSchema.purchasePrice.optional(),
  salePrice: baseProductSchema.salePrice.optional(),
  saleType: baseProductSchema.saleType.optional()
}).strict() // Prevent additional properties
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .refine(
    (data) => {
      // Only validate price relationship if both prices are provided
      if (data.purchasePrice && data.salePrice) {
        const purchasePrice = parseFloat(data.purchasePrice);
        const salePrice = parseFloat(data.salePrice);
        return salePrice >= purchasePrice;
      }
      return true;
    },
    {
      message: 'Sale price should not be lower than purchase price',
      path: ['salePrice']
    }
  );

// Product response schema
export const productResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  unit: z.string(),
  description: z.string().nullable(),
  stock: z.number(),
  purchasePrice: z.string(),
  salePrice: z.string(),
  saleType: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Product query filters schema
export const productFiltersSchema = z.object({
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
    .enum(['code', 'name', 'stock', 'salePrice', 'createdAt'], {
      message: 'Sort field must be code, name, stock, salePrice, or createdAt'
    })
    .optional()
    .default('name'),

  sortOrder: z
    .enum(['asc', 'desc'], {
      message: 'Sort order must be asc or desc'
    })
    .optional()
    .default('asc'),

  code: z
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
    .refine(val => !val || val.length <= 50, 'Code filter must be less than 50 characters'),

  name: z
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
    .refine(val => !val || val.length <= 255, 'Name filter must be less than 255 characters'),

  saleType: z
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
    .refine(val => !val || val.length <= 50, 'Sale type filter must be less than 50 characters'),

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
    .refine(val => !val || val.length <= 255, 'Search term must be less than 255 characters'),

  minStock: z
    .string()
    .trim()
    .optional()
    .transform(val => {
      // Treat empty strings, 'string', 'undefined', 'null' as undefined
      if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
        return undefined;
      }
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? undefined : parsed;
    })
    .refine(val => val === undefined || val >= 0, 'Minimum stock must be 0 or greater'),

  maxStock: z
    .string()
    .trim()
    .optional()
    .transform(val => {
      // Treat empty strings, 'string', 'undefined', 'null' as undefined
      if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
        return undefined;
      }
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? undefined : parsed;
    })
    .refine(val => val === undefined || val >= 0, 'Maximum stock must be 0 or greater')
}).refine(
  (data) => {
    if (data.minStock !== undefined && data.maxStock !== undefined) {
      return data.minStock <= data.maxStock;
    }
    return true;
  },
  {
    message: 'Minimum stock cannot be greater than maximum stock',
    path: ['minStock']
  }
);

// Product ID parameter schema
export const productIdSchema = z.object({
  id: z
    .string()
    .uuid('Invalid product ID format')
});

// Stock update schema
export const stockUpdateSchema = z.object({
  quantity: z
    .number()
    .int('Stock quantity must be an integer')
    .min(0, 'Stock quantity cannot be negative')
});

// Stock adjustment schema
export const stockAdjustmentSchema = z.object({
  adjustment: z
    .number()
    .int('Stock adjustment must be an integer')
});

// Paginated products response schema
export const paginatedProductsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(productResponseSchema),
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
export const productSuccessResponseSchema = z.object({
  success: z.boolean(),
  data: productResponseSchema,
  message: z.string().optional(),
  timestamp: z.string()
});

// Error response schema
export const productErrorResponseSchema = z.object({
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
export type CreateProductRequest = z.infer<typeof createProductSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
export type ProductFilters = z.infer<typeof productFiltersSchema>;
export type ProductIdParams = z.infer<typeof productIdSchema>;
export type StockUpdateRequest = z.infer<typeof stockUpdateSchema>;
export type StockAdjustmentRequest = z.infer<typeof stockAdjustmentSchema>;
export type PaginatedProductsResponse = z.infer<typeof paginatedProductsResponseSchema>;
export type ProductSuccessResponse = z.infer<typeof productSuccessResponseSchema>;
export type ProductErrorResponse = z.infer<typeof productErrorResponseSchema>;
export type ValidationErrorDetails = z.infer<typeof validationErrorDetailsSchema>;

// Custom validation functions
export const validateProductCode = (code: string): boolean => {
  return productCodeValidation(code);
};

export const validateProdFormat = (code: string): boolean => {
  // Validate strict PROD format (PROD + exactly 7 digits)
  return /^PROD\d{7}$/.test(code);
};

export const validateProductPrice = (price: string): boolean => {
  return priceValidation(price);
};

export const validatePriceRelationship = (purchasePrice: string, salePrice: string): boolean => {
  const purchase = parseFloat(purchasePrice);
  const sale = parseFloat(salePrice);
  return !isNaN(purchase) && !isNaN(sale) && sale >= purchase;
};

// Schema validation helpers
export const validateCreateProduct = (data: unknown) => {
  return createProductSchema.safeParse(data);
};

export const validateUpdateProduct = (data: unknown) => {
  return updateProductSchema.safeParse(data);
};

export const validateProductFilters = (data: unknown) => {
  return productFiltersSchema.safeParse(data);
};

export const validateProductId = (data: unknown) => {
  return productIdSchema.safeParse(data);
};

export const validateStockUpdate = (data: unknown) => {
  return stockUpdateSchema.safeParse(data);
};

export const validateStockAdjustment = (data: unknown) => {
  return stockAdjustmentSchema.safeParse(data);
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