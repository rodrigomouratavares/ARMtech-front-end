import { FastifyRequest, FastifyReply } from 'fastify';
import { reportsService, ReportFilters } from '../services/reports.service';
import { simpleReportsService } from '../services/reports.service.simple';
import {
    sanitizeAndValidateQuery,
    createPaymentMethodsReportResponse,
    createReportSummaryResponse,
    createErrorResponse,
    ReportsQuery
} from '../schemas/reports.schemas';

/**
 * Query parameters interface for reports endpoints
 */
interface ReportsQueryParams {
    startDate?: string;
    endDate?: string;
    paymentMethodId?: string;
    [key: string]: unknown;
}

/**
 * Reports controller class containing all reports-related HTTP handlers
 */
export class ReportsController {
    /**
     * Get payment methods report
     * GET /api/reports/payment-methods
     */
    async getPaymentMethodsReport(
        request: FastifyRequest<{ Querystring: ReportsQueryParams }>,
        reply: FastifyReply
    ) {
        try {
            // Sanitize and validate query parameters using schema
            const validatedQuery = sanitizeAndValidateQuery(request.query);

            // Convert to service filters format
            const filters = this.convertQueryToFilters(validatedQuery);

            // Validate filters using service (disabled for debugging)
            // await reportsService.validateFilters(filters);

            // Get report data using simple service (for debugging)
            const reportData = await simpleReportsService.getPaymentMethodsReport(filters);

            // Create standardized response
            const response = createPaymentMethodsReportResponse(reportData);
            return reply.status(200).send(response);

        } catch (error) {
            console.error('Error in getPaymentMethodsReport:', error);

            // Handle validation errors
            if (error instanceof Error && (
                error.message.includes('Invalid date') ||
                error.message.includes('Start date must be') ||
                error.message.includes('Payment method not found') ||
                error.message.includes('Both startDate and endDate')
            )) {
                const errorResponse = createErrorResponse(error.message, 'INVALID_FILTERS');
                return reply.status(400).send(errorResponse);
            }

            // Handle service errors
            if (error instanceof Error && error.message.includes('Failed to generate')) {
                const errorResponse = createErrorResponse(
                    'Internal server error while generating report',
                    'REPORT_GENERATION_ERROR'
                );
                return reply.status(500).send(errorResponse);
            }

            // Handle unexpected errors
            const errorResponse = createErrorResponse(
                'An unexpected error occurred',
                'INTERNAL_ERROR'
            );
            return reply.status(500).send(errorResponse);
        }
    }

    /**
     * Get report summary
     * GET /api/reports/summary
     */
    async getReportSummary(
        request: FastifyRequest<{ Querystring: ReportsQueryParams }>,
        reply: FastifyReply
    ) {
        try {
            // Sanitize and validate query parameters using schema
            const validatedQuery = sanitizeAndValidateQuery(request.query);

            // Convert to service filters format
            const filters = this.convertQueryToFilters(validatedQuery);

            // Validate filters using service (disabled for debugging)
            // await reportsService.validateFilters(filters);

            // Get summary data using simple service (for debugging)
            const summary = await simpleReportsService.getReportSummary(filters);

            // Create standardized response
            const response = createReportSummaryResponse(summary);
            return reply.status(200).send(response);

        } catch (error) {
            console.error('Error in getReportSummary:', error);

            // Handle validation errors
            if (error instanceof Error && (
                error.message.includes('Invalid date') ||
                error.message.includes('Start date must be') ||
                error.message.includes('Payment method not found') ||
                error.message.includes('Both startDate and endDate')
            )) {
                const errorResponse = createErrorResponse(error.message, 'INVALID_FILTERS');
                return reply.status(400).send(errorResponse);
            }

            // Handle service errors
            if (error instanceof Error && error.message.includes('Failed to generate')) {
                const errorResponse = createErrorResponse(
                    'Internal server error while generating summary',
                    'REPORT_GENERATION_ERROR'
                );
                return reply.status(500).send(errorResponse);
            }

            // Handle unexpected errors
            const errorResponse = createErrorResponse(
                'An unexpected error occurred',
                'INTERNAL_ERROR'
            );
            return reply.status(500).send(errorResponse);
        }
    }

    /**
     * Convert validated query to service filters format
     */
    private convertQueryToFilters(query: ReportsQuery): ReportFilters | undefined {
        const filters: ReportFilters = {};
        let hasFilters = false;

        // Convert date range
        if (query.startDate && query.endDate) {
            filters.dateRange = {
                startDate: new Date(query.startDate),
                endDate: new Date(query.endDate)
            };
            hasFilters = true;
        }

        // Convert payment method ID
        if (query.paymentMethodId) {
            filters.paymentMethodId = query.paymentMethodId;
            hasFilters = true;
        }

        return hasFilters ? filters : undefined;
    }

    /**
     * Parse and validate query parameters into filters (deprecated - use convertQueryToFilters)
     */
    private parseAndValidateFilters(query: ReportsQueryParams): ReportFilters | undefined {
        const filters: ReportFilters = {};
        let hasFilters = false;

        // Parse date range
        if (query.startDate && query.endDate) {
            const startDate = new Date(query.startDate);
            const endDate = new Date(query.endDate);

            // Basic date validation
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error('Invalid date format. Please use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)');
            }

            if (startDate > endDate) {
                throw new Error('Start date must be before or equal to end date');
            }

            filters.dateRange = { startDate, endDate };
            hasFilters = true;
        } else if (query.startDate || query.endDate) {
            throw new Error('Both startDate and endDate must be provided when filtering by date range');
        }

        // Parse payment method ID
        if (query.paymentMethodId) {
            // Basic UUID validation
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(query.paymentMethodId)) {
                throw new Error('Invalid payment method ID format');
            }

            filters.paymentMethodId = query.paymentMethodId;
            hasFilters = true;
        }

        return hasFilters ? filters : undefined;
    }

    /**
     * Sanitize query parameters to prevent injection attacks
     */
    private sanitizeQueryParams(query: ReportsQueryParams): ReportsQueryParams {
        const sanitized: ReportsQueryParams = {};

        if (query.startDate) {
            // Remove any non-date characters and limit length
            sanitized.startDate = query.startDate.replace(/[^0-9T:\-\.Z]/g, '').substring(0, 30);
        }

        if (query.endDate) {
            // Remove any non-date characters and limit length
            sanitized.endDate = query.endDate.replace(/[^0-9T:\-\.Z]/g, '').substring(0, 30);
        }

        if (query.paymentMethodId) {
            // Remove any non-UUID characters and limit length
            sanitized.paymentMethodId = query.paymentMethodId.replace(/[^0-9a-f\-]/gi, '').substring(0, 36);
        }

        return sanitized;
    }
}

// Export singleton instance
export const reportsController = new ReportsController();