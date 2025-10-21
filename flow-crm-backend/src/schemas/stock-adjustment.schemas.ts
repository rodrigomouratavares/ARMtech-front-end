import { z, ZodError } from 'zod';

/**
 * Zod validation schemas for stock adjustments
 */

// Stock adjustment type enum
const stockAdjustmentTypeEnum = z.enum(['add', 'remove'], {
    message: 'Adjustment type must be "add" or "remove"'
});

// Base stock adjustment schema
export const stockAdjustmentSchema = z.object({
    adjustmentType: stockAdjustmentTypeEnum,
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .min(1, 'Quantity must be greater than 0')
        .max(999999, 'Quantity cannot exceed 999,999'),
    reason: z
        .string()
        .min(1, 'Reason is required')
        .max(500, 'Reason must be 500 characters or less')
        .trim()
        .transform(reason => reason.replace(/\s+/g, ' ')) // Normalize whitespace
}).strict(); // Prevent additional properties

// Stock history filters schema
export const stockHistoryFiltersSchema = z.object({
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

    productId: z
        .string()
        .uuid('Invalid product ID format')
        .optional()
        .transform(val => {
            // Treat empty strings, 'string', 'undefined', 'null' as undefined
            if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
                return undefined;
            }
            return val;
        }),

    productCode: z
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
        .refine(val => !val || val.length <= 50, 'Product code filter must be less than 50 characters'),

    adjustmentType: stockAdjustmentTypeEnum.optional(),

    startDate: z
        .string()
        .optional()
        .transform(val => {
            if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
                return undefined;
            }
            const date = new Date(val);
            return isNaN(date.getTime()) ? undefined : date;
        })
        .refine(val => !val || val instanceof Date, 'Start date must be a valid date'),

    endDate: z
        .string()
        .optional()
        .transform(val => {
            if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
                return undefined;
            }
            const date = new Date(val);
            return isNaN(date.getTime()) ? undefined : date;
        })
        .refine(val => !val || val instanceof Date, 'End date must be a valid date'),

    userId: z
        .string()
        .uuid('Invalid user ID format')
        .optional()
        .transform(val => {
            // Treat empty strings, 'string', 'undefined', 'null' as undefined
            if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
                return undefined;
            }
            return val;
        })
}).refine(
    (data) => {
        if (data.startDate && data.endDate) {
            return data.startDate <= data.endDate;
        }
        return true;
    },
    {
        message: 'Start date cannot be after end date',
        path: ['startDate']
    }
);

// Product ID parameter schema
export const productIdSchema = z.object({
    id: z
        .string()
        .uuid('Invalid product ID format')
});

// Stock adjustment response schema
export const stockAdjustmentResponseSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    productCode: z.string(),
    productName: z.string(),
    adjustmentType: stockAdjustmentTypeEnum,
    quantity: z.number(),
    previousStock: z.number(),
    newStock: z.number(),
    reason: z.string(),
    userId: z.string().uuid().nullable(),
    userName: z.string(),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
    createdAt: z.date()
});

// Stock adjustment result schema
export const stockAdjustmentResultSchema = z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    stock: z.number(),
    previousStock: z.number(),
    adjustment: z.object({
        id: z.string().uuid(),
        type: stockAdjustmentTypeEnum,
        quantity: z.number(),
        reason: z.string(),
        createdAt: z.date()
    })
});

// Paginated stock adjustments response schema
export const paginatedStockAdjustmentsResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(stockAdjustmentResponseSchema),
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
export const stockAdjustmentSuccessResponseSchema = z.object({
    success: z.boolean(),
    data: stockAdjustmentResultSchema,
    message: z.string().optional(),
    timestamp: z.string()
});

// Error response schema
export const stockAdjustmentErrorResponseSchema = z.object({
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
export type StockAdjustmentRequest = z.infer<typeof stockAdjustmentSchema>;
export type StockHistoryFilters = z.infer<typeof stockHistoryFiltersSchema>;
export type ProductIdParams = z.infer<typeof productIdSchema>;
export type StockAdjustmentResponse = z.infer<typeof stockAdjustmentResponseSchema>;
export type StockAdjustmentResult = z.infer<typeof stockAdjustmentResultSchema>;
export type PaginatedStockAdjustmentsResponse = z.infer<typeof paginatedStockAdjustmentsResponseSchema>;
export type StockAdjustmentSuccessResponse = z.infer<typeof stockAdjustmentSuccessResponseSchema>;
export type StockAdjustmentErrorResponse = z.infer<typeof stockAdjustmentErrorResponseSchema>;
export type ValidationErrorDetails = z.infer<typeof validationErrorDetailsSchema>;

// Schema validation helpers
export const validateStockAdjustment = (data: unknown) => {
    return stockAdjustmentSchema.safeParse(data);
};

export const validateStockHistoryFilters = (data: unknown) => {
    return stockHistoryFiltersSchema.safeParse(data);
};

export const validateProductId = (data: unknown) => {
    return productIdSchema.safeParse(data);
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

// Custom validation functions
export const validateAdjustmentType = (type: string): boolean => {
    return ['add', 'remove'].includes(type);
};

export const validateQuantity = (quantity: number): boolean => {
    return Number.isInteger(quantity) && quantity > 0 && quantity <= 999999;
};

export const validateReason = (reason: string): boolean => {
    return typeof reason === 'string' && reason.trim().length > 0 && reason.length <= 500;
};