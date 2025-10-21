import { z, ZodError } from 'zod';

/**
 * Zod validation schemas for price calculations
 */

// Price validation function for Zod
const priceValidation = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return !isNaN(numPrice) && numPrice >= 0;
};

// Percentage validation function
const percentageValidation = (percentage: number) => {
    return !isNaN(percentage) && percentage >= 0 && percentage <= 100;
};

// Quantity validation function
const quantityValidation = (quantity: string | number) => {
    const numQuantity = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    return !isNaN(numQuantity) && numQuantity > 0;
};

// Base price calculation parameters schema
export const priceCalculationParamsSchema = z.object({
    productId: z
        .string()
        .uuid('Product ID must be a valid UUID')
        .min(1, 'Product ID is required'),

    quantity: z
        .string()
        .min(1, 'Quantity is required')
        .regex(/^\d+(\.\d{1,3})?$/, 'Quantity must be a valid decimal number with up to 3 decimal places')
        .refine(quantityValidation, 'Quantity must be a positive number'),

    basePrice: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, 'Base price must be a valid decimal number with up to 2 decimal places')
        .refine(priceValidation, 'Base price must be a valid positive number')
        .optional(),

    customerId: z
        .string()
        .uuid('Customer ID must be a valid UUID')
        .optional(),

    applyPromotions: z
        .boolean()
        .optional()
        .default(true),

    includeTaxes: z
        .boolean()
        .optional()
        .default(true)
}).strict();

// Margin/markup calculation parameters schema
export const marginMarkupParamsSchema = z.object({
    cost: z
        .union([
            z.string().regex(/^\d+(\.\d{1,2})?$/, 'Cost must be a valid decimal number with up to 2 decimal places'),
            z.number().min(0, 'Cost must be a positive number')
        ])
        .refine((val) => {
            const numVal = typeof val === 'string' ? parseFloat(val) : val;
            return priceValidation(numVal);
        }, 'Cost must be a valid positive number'),

    sellingPrice: z
        .union([
            z.string().regex(/^\d+(\.\d{1,2})?$/, 'Selling price must be a valid decimal number with up to 2 decimal places'),
            z.number().min(0, 'Selling price must be a positive number')
        ])
        .refine((val) => {
            const numVal = typeof val === 'string' ? parseFloat(val) : val;
            return priceValidation(numVal);
        }, 'Selling price must be a valid positive number')
}).strict()
    .refine(
        (data) => {
            const cost = typeof data.cost === 'string' ? parseFloat(data.cost) : data.cost;
            const sellingPrice = typeof data.sellingPrice === 'string' ? parseFloat(data.sellingPrice) : data.sellingPrice;
            return sellingPrice >= cost;
        },
        {
            message: 'Selling price must be greater than or equal to cost',
            path: ['sellingPrice']
        }
    );

// Price suggestion parameters schema
export const priceSuggestionParamsSchema = z.object({
    productId: z
        .string()
        .uuid('Product ID must be a valid UUID')
        .min(1, 'Product ID is required'),

    targetMargin: z
        .number()
        .min(0, 'Target margin must be 0 or greater')
        .max(100, 'Target margin cannot exceed 100%')
        .refine(percentageValidation, 'Target margin must be a valid percentage')
        .optional(),

    targetMarkup: z
        .number()
        .min(0, 'Target markup must be 0 or greater')
        .refine((val) => !isNaN(val) && val >= 0, 'Target markup must be a valid positive number')
        .optional(),

    customerId: z
        .string()
        .uuid('Customer ID must be a valid UUID')
        .optional(),

    quantity: z
        .string()
        .regex(/^\d+(\.\d{1,3})?$/, 'Quantity must be a valid decimal number with up to 3 decimal places')
        .refine(quantityValidation, 'Quantity must be a positive number')
        .optional()
        .default('1')
}).strict()
    .refine(
        (data) => {
            // Either targetMargin or targetMarkup must be provided, but not both
            const hasMargin = data.targetMargin !== undefined;
            const hasMarkup = data.targetMarkup !== undefined;
            return hasMargin !== hasMarkup; // XOR - exactly one must be true
        },
        {
            message: 'Either target margin or target markup must be provided, but not both',
            path: ['targetMargin']
        }
    );

// Product ID parameter schema for price endpoints
export const priceProductIdSchema = z.object({
    id: z
        .string()
        .uuid('Invalid product ID format')
});

// Type exports for request schemas
export type PriceCalculationParams = z.infer<typeof priceCalculationParamsSchema>;
export type MarginMarkupParams = z.infer<typeof marginMarkupParamsSchema>;
export type PriceSuggestionParams = z.infer<typeof priceSuggestionParamsSchema>;
export type PriceProductIdParams = z.infer<typeof priceProductIdSchema>;

// Schema validation helpers
export const validatePriceCalculationParams = (data: unknown) => {
    return priceCalculationParamsSchema.safeParse(data);
};

export const validateMarginMarkupParams = (data: unknown) => {
    return marginMarkupParamsSchema.safeParse(data);
};

export const validatePriceSuggestionParams = (data: unknown) => {
    return priceSuggestionParamsSchema.safeParse(data);
};

export const validatePriceProductId = (data: unknown) => {
    return priceProductIdSchema.safeParse(data);
};

// Custom validation functions
export const validatePrice = (price: string | number): boolean => {
    return priceValidation(price);
};

export const validateQuantity = (quantity: string | number): boolean => {
    return quantityValidation(quantity);
};

export const validatePercentage = (percentage: number): boolean => {
    return percentageValidation(percentage);
};

export const validateCostSellingPriceRelationship = (cost: string | number, sellingPrice: string | number): boolean => {
    const numCost = typeof cost === 'string' ? parseFloat(cost) : cost;
    const numSellingPrice = typeof sellingPrice === 'string' ? parseFloat(sellingPrice) : sellingPrice;
    return !isNaN(numCost) && !isNaN(numSellingPrice) && numSellingPrice >= numCost;
};

// Error message helpers
export const getPriceValidationErrorMessage = (error: ZodError): string => {
    const firstError = error.issues[0];
    return firstError?.message || 'Price validation failed';
};

export const getPriceValidationErrorDetails = (error: ZodError) => {
    return error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.code === 'invalid_type' ? undefined : err.input
    }));
};

// Response schemas

// Discount breakdown schema
export const discountBreakdownSchema = z.object({
    customerDiscount: z.number().min(0, 'Customer discount must be 0 or greater'),
    promotionalDiscount: z.number().min(0, 'Promotional discount must be 0 or greater'),
    totalDiscount: z.number().min(0, 'Total discount must be 0 or greater')
});

// Tax breakdown schema
export const taxBreakdownSchema = z.object({
    amount: z.number().min(0, 'Tax amount must be 0 or greater'),
    rate: z.number().min(0, 'Tax rate must be 0 or greater')
});

// Margin breakdown schema
export const marginBreakdownSchema = z.object({
    amount: z.number(),
    percentage: z.number()
});

// Markup breakdown schema
export const markupBreakdownSchema = z.object({
    amount: z.number(),
    percentage: z.number()
});

// Calculation details schema
export const calculationDetailsSchema = z.object({
    cost: z.number().min(0, 'Cost must be 0 or greater'),
    profit: z.number(),
    timestamp: z.date()
});

// Price calculation result schema
export const priceCalculationResultSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive('Quantity must be positive'),
    basePrice: z.number().min(0, 'Base price must be 0 or greater'),
    subtotal: z.number().min(0, 'Subtotal must be 0 or greater'),
    discounts: discountBreakdownSchema,
    taxes: taxBreakdownSchema,
    finalPrice: z.number().min(0, 'Final price must be 0 or greater'),
    margin: marginBreakdownSchema,
    markup: markupBreakdownSchema,
    calculationDetails: calculationDetailsSchema
});

// Margin/markup calculation result schema
export const marginMarkupResultSchema = z.object({
    cost: z.number().min(0, 'Cost must be 0 or greater'),
    sellingPrice: z.number().min(0, 'Selling price must be 0 or greater'),
    profit: z.number(),
    margin: marginBreakdownSchema,
    markup: markupBreakdownSchema
});

// Price suggestion result schema
export const priceSuggestionResultSchema = z.object({
    productId: z.string().uuid(),
    suggestedPrice: z.number().min(0, 'Suggested price must be 0 or greater'),
    currentPrice: z.number().min(0, 'Current price must be 0 or greater'),
    cost: z.number().min(0, 'Cost must be 0 or greater'),
    projectedMargin: marginBreakdownSchema,
    projectedMarkup: markupBreakdownSchema,
    recommendations: z.array(z.string())
});

// Success response schemas
export const priceCalculationSuccessResponseSchema = z.object({
    success: z.boolean().default(true),
    data: priceCalculationResultSchema,
    message: z.string().optional(),
    timestamp: z.string()
});

export const marginMarkupSuccessResponseSchema = z.object({
    success: z.boolean().default(true),
    data: marginMarkupResultSchema,
    message: z.string().optional(),
    timestamp: z.string()
});

export const priceSuggestionSuccessResponseSchema = z.object({
    success: z.boolean().default(true),
    data: priceSuggestionResultSchema,
    message: z.string().optional(),
    timestamp: z.string()
});

// Error response schemas
export const priceCalculationErrorSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.object({
        field: z.string().optional(),
        value: z.any().optional(),
        constraint: z.string().optional()
    }).optional()
});

export const priceErrorResponseSchema = z.object({
    success: z.boolean().default(false),
    error: priceCalculationErrorSchema,
    timestamp: z.string(),
    path: z.string().optional()
});

// Validation error details schema for price calculations
export const priceValidationErrorDetailsSchema = z.object({
    field: z.string(),
    message: z.string(),
    value: z.any().optional()
});

// Type exports for response schemas
export type DiscountBreakdown = z.infer<typeof discountBreakdownSchema>;
export type TaxBreakdown = z.infer<typeof taxBreakdownSchema>;
export type MarginBreakdown = z.infer<typeof marginBreakdownSchema>;
export type MarkupBreakdown = z.infer<typeof markupBreakdownSchema>;
export type CalculationDetails = z.infer<typeof calculationDetailsSchema>;
export type PriceCalculationResult = z.infer<typeof priceCalculationResultSchema>;
export type MarginMarkupResult = z.infer<typeof marginMarkupResultSchema>;
export type PriceSuggestionResult = z.infer<typeof priceSuggestionResultSchema>;
export type PriceCalculationSuccessResponse = z.infer<typeof priceCalculationSuccessResponseSchema>;
export type MarginMarkupSuccessResponse = z.infer<typeof marginMarkupSuccessResponseSchema>;
export type PriceSuggestionSuccessResponse = z.infer<typeof priceSuggestionSuccessResponseSchema>;
export type PriceCalculationError = z.infer<typeof priceCalculationErrorSchema>;
export type PriceErrorResponse = z.infer<typeof priceErrorResponseSchema>;
export type PriceValidationErrorDetails = z.infer<typeof priceValidationErrorDetailsSchema>;

// Response validation helpers
export const validatePriceCalculationResult = (data: unknown) => {
    return priceCalculationResultSchema.safeParse(data);
};

export const validateMarginMarkupResult = (data: unknown) => {
    return marginMarkupResultSchema.safeParse(data);
};

export const validatePriceSuggestionResult = (data: unknown) => {
    return priceSuggestionResultSchema.safeParse(data);
};

export const validatePriceCalculationSuccessResponse = (data: unknown) => {
    return priceCalculationSuccessResponseSchema.safeParse(data);
};

export const validateMarginMarkupSuccessResponse = (data: unknown) => {
    return marginMarkupSuccessResponseSchema.safeParse(data);
};

export const validatePriceSuggestionSuccessResponse = (data: unknown) => {
    return priceSuggestionSuccessResponseSchema.safeParse(data);
};

export const validatePriceErrorResponse = (data: unknown) => {
    return priceErrorResponseSchema.safeParse(data);
};