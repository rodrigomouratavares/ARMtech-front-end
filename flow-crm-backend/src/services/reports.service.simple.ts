import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { db } from '../db/connection';
import { preSales } from '../db/schema/presales';
import { paymentMethods } from '../db/schema/payment-methods';
import type { ReportFilters, PaymentMethodReportData, ReportSummary } from './reports.service';

/**
 * Simplified reports service for debugging
 */
export class SimpleReportsService {
    /**
     * Test database connectivity and table existence
     */
    async testDatabase() {
        try {
            // Test payment methods table
            const paymentMethodsTest = await db.select().from(paymentMethods).limit(1);

            // Test presales table
            const presalesTest = await db.select().from(preSales).limit(1);

            return {
                success: true,
                paymentMethodsExists: true,
                paymentMethodsCount: paymentMethodsTest.length,
                presalesExists: true,
                presalesCount: presalesTest.length
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get payment methods report with minimal complexity
     */
    async getPaymentMethodsReport(filters?: ReportFilters): Promise<PaymentMethodReportData[]> {
        try {
            console.log('SimpleReportsService: Getting payment methods report with filters:', filters);

            // First, get all active payment methods
            const paymentMethodsResult = await db
                .select()
                .from(paymentMethods)
                .where(eq(paymentMethods.isActive, true));

            console.log(`SimpleReportsService: Found ${paymentMethodsResult.length} active payment methods`);



            // If no payment methods, return empty array
            if (paymentMethodsResult.length === 0) {
                return [];
            }

            // Try to get actual presales data
            const results = [];



            for (const pm of paymentMethodsResult) {
                try {
                    // Build conditions for this payment method
                    const conditions = [
                        eq(preSales.paymentMethodId, pm.id),
                        eq(preSales.status, 'converted')
                    ];

                    // Add date range filter if provided
                    if (filters?.dateRange) {
                        conditions.push(
                            gte(preSales.createdAt, filters.dateRange.startDate),
                            lte(preSales.createdAt, filters.dateRange.endDate)
                        );
                    }

                    // Get aggregated data for this payment method using LEFT JOIN
                    const aggregateResult = await db
                        .select({
                            totalAmount: sql<number>`COALESCE(SUM(${preSales.total}::numeric), 0)`,
                            salesCount: sql<number>`COALESCE(COUNT(CASE WHEN ${preSales.id} IS NOT NULL THEN 1 END), 0)`
                        })
                        .from(paymentMethods)
                        .leftJoin(preSales, and(
                            eq(paymentMethods.id, preSales.paymentMethodId),
                            eq(preSales.status, 'converted'),
                            ...(filters?.dateRange ? [
                                gte(preSales.createdAt, filters.dateRange.startDate),
                                lte(preSales.createdAt, filters.dateRange.endDate)
                            ] : [])
                        ))
                        .where(eq(paymentMethods.id, pm.id))
                        .limit(1);



                    const row = aggregateResult[0];
                    const totalAmount = parseFloat(row?.totalAmount?.toString() || '0');
                    const salesCount = parseInt(row?.salesCount?.toString() || '0');

                    results.push({
                        paymentMethod: {
                            id: pm.id,
                            code: pm.code,
                            description: pm.description,
                            isActive: pm.isActive,
                            createdAt: pm.createdAt,
                            updatedAt: pm.updatedAt
                        },
                        totalAmount,
                        salesCount,
                        convertedPresalesCount: salesCount, // All are converted presales
                        convertedPresalesAmount: totalAmount // All amounts are from converted presales
                    });

                    console.log(`SimpleReportsService: ${pm.description}: ${salesCount} sales, R$ ${totalAmount}`);

                } catch (pmError) {
                    console.error(`SimpleReportsService: Error processing payment method ${pm.description}:`, pmError);

                    // Add with zero values if there's an error
                    results.push({
                        paymentMethod: {
                            id: pm.id,
                            code: pm.code,
                            description: pm.description,
                            isActive: pm.isActive,
                            createdAt: pm.createdAt,
                            updatedAt: pm.updatedAt
                        },
                        totalAmount: 0,
                        salesCount: 0,
                        convertedPresalesCount: 0,
                        convertedPresalesAmount: 0
                    });
                }
            }

            // Sort by total amount descending
            results.sort((a, b) => b.totalAmount - a.totalAmount);

            console.log(`SimpleReportsService: Returning ${results.length} payment methods`);
            return results;

        } catch (error) {
            console.error('Error in simple payment methods report:', error);
            throw new Error(`Failed to generate payment methods report: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get report summary with minimal complexity
     */
    async getReportSummary(filters?: ReportFilters): Promise<ReportSummary> {
        try {
            console.log('SimpleReportsService: Getting report summary with filters:', filters);

            // Build conditions
            const conditions = [eq(preSales.status, 'converted')];

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

            // Get summary data
            const result = await db
                .select({
                    totalAmount: sql<number>`COALESCE(SUM(${preSales.total}::numeric), 0)`,
                    totalSalesCount: sql<number>`COALESCE(COUNT(${preSales.id}), 0)`
                })
                .from(preSales)
                .where(and(...conditions))
                .limit(1);

            const row = result[0];

            const totalAmount = parseFloat(row?.totalAmount?.toString() || '0');
            const totalSalesCount = parseInt(row?.totalSalesCount?.toString() || '0');

            // Set default period if not provided
            const period = filters?.dateRange || {
                startDate: new Date(new Date().getFullYear(), 0, 1), // Start of current year
                endDate: new Date() // Current date
            };

            const summary = {
                totalAmount,
                totalSalesCount,
                totalConvertedPresales: totalSalesCount, // All are converted presales
                totalConvertedPresalesAmount: totalAmount, // All amounts are from converted presales
                period
            };

            console.log('SimpleReportsService: Summary result:', summary);
            return summary;

        } catch (error) {
            console.error('Error in simple report summary:', error);
            throw new Error(`Failed to generate report summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

// Export singleton instance
export const simpleReportsService = new SimpleReportsService();