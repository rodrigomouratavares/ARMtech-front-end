import { z } from 'zod';

/**
 * UUID validation schema
 */
const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Date string validation schema
 */
const dateStringSchema = z.string().datetime('Invalid date format. Please use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)');

/**
 * Reports query parameters schema
 */
export const reportsQuerySchema = z.object({
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    paymentMethodId: uuidSchema.optional()
}).refine(
    (data) => {
        // If one date is provided, both must be provided
        if (data.startDate && !data.endDate) {
            return false;
        }
        if (!data.startDate && data.endDate) {
            return false;
        }
        return true;
    },
    {
        message: 'Both startDate and endDate must be provided when filtering by date range',
        path: ['dateRange']
    }
).refine(
    (data) => {
        // If both dates are provided, startDate must be before or equal to endDate
        if (data.startDate && data.endDate) {
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);
            return start <= end;
        }
        return true;
    },
    {
        message: 'Start date must be before or equal to end date',
        path: ['dateRange']
    }
).refine(
    (data) => {
        // Start date cannot be in the future
        if (data.startDate) {
            const start = new Date(data.startDate);
            const now = new Date();
            return start <= now;
        }
        return true;
    },
    {
        message: 'Start date cannot be in the future',
        path: ['startDate']
    }
);

/**
 * Payment method schema for responses
 */
export const paymentMethodSchema = z.object({
    id: uuidSchema,
    code: z.string().min(1, 'Payment method code is required'),
    description: z.string().min(1, 'Payment method description is required'),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
});

/**
 * Payment method report data schema
 */
export const paymentMethodReportDataSchema = z.object({
    paymentMethod: paymentMethodSchema,
    totalAmount: z.number().min(0, 'Total amount must be non-negative'),
    salesCount: z.number().int().min(0, 'Sales count must be a non-negative integer'),
    convertedPresalesCount: z.number().int().min(0, 'Converted presales count must be a non-negative integer'),
    convertedPresalesAmount: z.number().min(0, 'Converted presales amount must be non-negative')
});

/**
 * Report summary schema
 */
export const reportSummarySchema = z.object({
    totalAmount: z.number().min(0, 'Total amount must be non-negative'),
    totalSalesCount: z.number().int().min(0, 'Total sales count must be a non-negative integer'),
    totalConvertedPresales: z.number().int().min(0, 'Total converted presales must be a non-negative integer'),
    totalConvertedPresalesAmount: z.number().min(0, 'Total converted presales amount must be non-negative'),
    period: z.object({
        startDate: z.date(),
        endDate: z.date()
    })
});

/**
 * Payment methods report response schema
 */
export const paymentMethodsReportResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(paymentMethodReportDataSchema),
    message: z.string()
});

/**
 * Report summary response schema
 */
export const reportSummaryResponseSchema = z.object({
    success: z.boolean(),
    data: reportSummarySchema,
    message: z.string()
});

/**
 * Error response schema
 */
export const errorResponseSchema = z.object({
    success: z.literal(false),
    message: z.string(),
    code: z.string()
});

/**
 * Type definitions derived from schemas
 */
export type ReportsQuery = z.infer<typeof reportsQuerySchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PaymentMethodReportData = z.infer<typeof paymentMethodReportDataSchema>;
export type ReportSummary = z.infer<typeof reportSummarySchema>;
export type PaymentMethodsReportResponse = z.infer<typeof paymentMethodsReportResponseSchema>;
export type ReportSummaryResponse = z.infer<typeof reportSummaryResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Validation functions
 */

/**
 * Validate reports query parameters
 */
export function validateReportsQuery(query: unknown): ReportsQuery {
    try {
        return reportsQuerySchema.parse(query);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            throw new Error(firstError.message);
        }
        throw new Error('Invalid query parameters');
    }
}

/**
 * Validate payment method report data
 */
export function validatePaymentMethodReportData(data: unknown): PaymentMethodReportData {
    try {
        return paymentMethodReportDataSchema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            throw new Error(`Invalid payment method report data: ${firstError.message}`);
        }
        throw new Error('Invalid payment method report data');
    }
}

/**
 * Validate report summary data
 */
export function validateReportSummary(data: unknown): ReportSummary {
    try {
        return reportSummarySchema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            throw new Error(`Invalid report summary data: ${firstError.message}`);
        }
        throw new Error('Invalid report summary data');
    }
}

/**
 * Sanitize and validate query string parameters
 */
export function sanitizeAndValidateQuery(query: Record<string, unknown>): ReportsQuery {
    // Sanitize string inputs
    const sanitized: Record<string, unknown> = {};

    if (query.startDate && typeof query.startDate === 'string') {
        // Remove potentially dangerous characters and limit length
        sanitized.startDate = query.startDate.replace(/[^\w\-:\.TZ]/g, '').substring(0, 30);
    }

    if (query.endDate && typeof query.endDate === 'string') {
        // Remove potentially dangerous characters and limit length
        sanitized.endDate = query.endDate.replace(/[^\w\-:\.TZ]/g, '').substring(0, 30);
    }

    if (query.paymentMethodId && typeof query.paymentMethodId === 'string') {
        // Remove non-UUID characters and limit length
        sanitized.paymentMethodId = query.paymentMethodId.replace(/[^0-9a-f\-]/gi, '').substring(0, 36);
    }

    // Validate the sanitized input
    return validateReportsQuery(sanitized);
}

/**
 * Create standardized error response
 */
export function createErrorResponse(message: string, code: string): ErrorResponse {
    return {
        success: false,
        message,
        code
    };
}

/**
 * Create standardized success response for payment methods report
 */
export function createPaymentMethodsReportResponse(
    data: PaymentMethodReportData[],
    message: string = 'Payment methods report generated successfully'
): PaymentMethodsReportResponse {
    return {
        success: true,
        data,
        message
    };
}

/**
 * Create standardized success response for report summary
 */
export function createReportSummaryResponse(
    data: ReportSummary,
    message: string = 'Report summary generated successfully'
): ReportSummaryResponse {
    return {
        success: true,
        data,
        message
    };
}