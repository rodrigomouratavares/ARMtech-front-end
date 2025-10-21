import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { db } from '../db/connection';
import { preSales } from '../db/schema/presales';
import { paymentMethods } from '../db/schema/payment-methods';

/**
 * Report filters interface
 */
export interface ReportFilters {
    dateRange?: {
        startDate: Date;
        endDate: Date;
    };
    paymentMethodId?: string;
}

/**
 * Payment method report data interface
 */
export interface PaymentMethodReportData {
    paymentMethod: {
        id: string;
        code: string;
        description: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    totalAmount: number;
    salesCount: number;
    convertedPresalesCount: number;
    convertedPresalesAmount: number;
}

/**
 * Report summary interface
 */
export interface ReportSummary {
    totalAmount: number;
    totalSalesCount: number;
    totalConvertedPresales: number;
    totalConvertedPresalesAmount: number;
    period: {
        startDate: Date;
        endDate: Date;
    };
}

/**
 * Reports service class containing all reports-related business logic
 */
export class ReportsService {
    /**
     * Get payment methods report with aggregated data
     */
    async getPaymentMethodsReport(filters?: ReportFilters): Promise<PaymentMethodReportData[]> {
        try {
            // Build the base query conditions
            const conditions = [
                eq(preSales.status, 'converted'), // Only converted presales (completed sales)
                eq(paymentMethods.isActive, true) // Only active payment methods
            ];

            // Add date range filter if provided
            if (filters?.dateRange) {
                conditions.push(
                    gte(preSales.createdAt, filters.dateRange.startDate),
                    lte(preSales.createdAt, filters.dateRange.endDate)
                );
            }

            // Add payment method filter if provided
            if (filters?.paymentMethodId) {
                conditions.push(eq(preSales.paymentMethodId, filters.paymentMethodId));
            }

            // Execute the aggregation query
            const results = await db
                .select({
                    paymentMethodId: paymentMethods.id,
                    paymentMethodCode: paymentMethods.code,
                    paymentMethodDescription: paymentMethods.description,
                    paymentMethodIsActive: paymentMethods.isActive,
                    paymentMethodCreatedAt: paymentMethods.createdAt,
                    paymentMethodUpdatedAt: paymentMethods.updatedAt,
                    totalAmount: sql<number>`COALESCE(SUM(${preSales.total}), 0)`,
                    salesCount: sql<number>`COALESCE(COUNT(${preSales.id}), 0)`,
                    convertedPresalesCount: sql<number>`COALESCE(COUNT(${preSales.id}), 0)`, // All are converted presales
                    convertedPresalesAmount: sql<number>`COALESCE(SUM(${preSales.total}), 0)` // All amounts are from converted presales
                })
                .from(paymentMethods)
                .leftJoin(
                    preSales,
                    and(
                        eq(paymentMethods.id, preSales.paymentMethodId),
                        eq(preSales.status, 'converted'),
                        ...(filters?.dateRange ? [
                            gte(preSales.createdAt, filters.dateRange.startDate),
                            lte(preSales.createdAt, filters.dateRange.endDate)
                        ] : [])
                    )
                )
                .where(
                    and(
                        eq(paymentMethods.isActive, true),
                        ...(filters?.paymentMethodId ? [eq(paymentMethods.id, filters.paymentMethodId)] : [])
                    )
                )
                .groupBy(
                    paymentMethods.id,
                    paymentMethods.code,
                    paymentMethods.description,
                    paymentMethods.isActive,
                    paymentMethods.createdAt,
                    paymentMethods.updatedAt
                )
                .orderBy(desc(sql`COALESCE(SUM(${preSales.total}), 0)`));

            // Format the results
            return results.map(row => ({
                paymentMethod: {
                    id: row.paymentMethodId,
                    code: row.paymentMethodCode,
                    description: row.paymentMethodDescription,
                    isActive: row.paymentMethodIsActive,
                    createdAt: row.paymentMethodCreatedAt,
                    updatedAt: row.paymentMethodUpdatedAt
                },
                totalAmount: parseFloat(row.totalAmount?.toString() || '0'),
                salesCount: parseInt(row.salesCount?.toString() || '0'),
                convertedPresalesCount: parseInt(row.convertedPresalesCount?.toString() || '0'),
                convertedPresalesAmount: parseFloat(row.convertedPresalesAmount?.toString() || '0')
            }));

        } catch (error) {
            console.error('Error generating payment methods report:', error);
            throw new Error(`Failed to generate payment methods report: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get report summary with totals
     */
    async getReportSummary(filters?: ReportFilters): Promise<ReportSummary> {
        try {
            // Build the query conditions
            const conditions = [
                eq(preSales.status, 'converted'), // Only converted presales (completed sales)
                eq(paymentMethods.isActive, true) // Only active payment methods
            ];

            // Add date range filter if provided
            if (filters?.dateRange) {
                conditions.push(
                    gte(preSales.createdAt, filters.dateRange.startDate),
                    lte(preSales.createdAt, filters.dateRange.endDate)
                );
            }

            // Add payment method filter if provided
            if (filters?.paymentMethodId) {
                conditions.push(eq(preSales.paymentMethodId, filters.paymentMethodId));
            }

            // Execute the summary query
            const result = await db
                .select({
                    totalAmount: sql<number>`COALESCE(SUM(${preSales.total}), 0)`,
                    totalSalesCount: sql<number>`COALESCE(COUNT(${preSales.id}), 0)`,
                    totalConvertedPresales: sql<number>`COALESCE(COUNT(${preSales.id}), 0)`, // All are converted presales
                    totalConvertedPresalesAmount: sql<number>`COALESCE(SUM(${preSales.total}), 0)` // All amounts are from converted presales
                })
                .from(preSales)
                .innerJoin(paymentMethods, eq(preSales.paymentMethodId, paymentMethods.id))
                .where(and(...conditions))
                .limit(1);

            const row = result[0];

            // Set default period if not provided
            const period = filters?.dateRange || {
                startDate: new Date(new Date().getFullYear(), 0, 1), // Start of current year
                endDate: new Date() // Current date
            };

            return {
                totalAmount: parseFloat(row?.totalAmount?.toString() || '0'),
                totalSalesCount: parseInt(row?.totalSalesCount?.toString() || '0'),
                totalConvertedPresales: parseInt(row?.totalConvertedPresales?.toString() || '0'),
                totalConvertedPresalesAmount: parseFloat(row?.totalConvertedPresalesAmount?.toString() || '0'),
                period
            };

        } catch (error) {
            console.error('Error generating report summary:', error);
            throw new Error(`Failed to generate report summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Validate date range filters
     */
    private validateDateRange(startDate: Date, endDate: Date): void {
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date format provided');
        }

        if (startDate > endDate) {
            throw new Error('Start date must be before or equal to end date');
        }

        // Check if date range is not too far in the future
        const now = new Date();
        if (startDate > now) {
            throw new Error('Start date cannot be in the future');
        }
    }

    /**
     * Validate payment method ID
     */
    private async validatePaymentMethodId(paymentMethodId: string): Promise<void> {
        const paymentMethod = await db
            .select({ id: paymentMethods.id })
            .from(paymentMethods)
            .where(and(
                eq(paymentMethods.id, paymentMethodId),
                eq(paymentMethods.isActive, true)
            ))
            .limit(1);

        if (paymentMethod.length === 0) {
            throw new Error('Payment method not found or inactive');
        }
    }

    /**
     * Validate filters before processing
     */
    async validateFilters(filters?: ReportFilters): Promise<void> {
        if (!filters) return;

        if (filters.dateRange) {
            this.validateDateRange(filters.dateRange.startDate, filters.dateRange.endDate);
        }

        if (filters.paymentMethodId) {
            await this.validatePaymentMethodId(filters.paymentMethodId);
        }
    }
}

// Export singleton instance
export const reportsService = new ReportsService();