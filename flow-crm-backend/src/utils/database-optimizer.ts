/**
 * Database Optimization Utility
 * Provides query optimization and connection pooling for better performance
 */

import { db } from '../db/connection';
import { products } from '../db/schema/products';
import { customers } from '../db/schema/customers';
import { eq, inArray } from 'drizzle-orm';
import { productCache, customerCache } from './cache-manager';

/**
 * Interface for batch query result
 */
export interface BatchQueryResult<T> {
    found: T[];
    missing: string[];
    fromCache: number;
    fromDatabase: number;
}

/**
 * Database optimizer class for improved query performance
 */
export class DatabaseOptimizer {
    /**
     * Batch fetch products with caching
     */
    static async batchGetProducts(productIds: string[]): Promise<BatchQueryResult<any>> {
        const found: any[] = [];
        const missing: string[] = [];
        let fromCache = 0;
        let fromDatabase = 0;

        // Check cache first
        const uncachedIds: string[] = [];
        for (const id of productIds) {
            const cached = productCache.get(id);
            if (cached) {
                found.push(cached);
                fromCache++;
            } else {
                uncachedIds.push(id);
            }
        }

        // Fetch uncached products from database
        if (uncachedIds.length > 0) {
            const queryStart = Date.now();

            const dbResults = await db
                .select()
                .from(products)
                .where(inArray(products.id, uncachedIds));

            const queryTime = Date.now() - queryStart;
            console.log(`[DB_OPTIMIZER] Batch product query took ${queryTime}ms for ${uncachedIds.length} IDs`);

            // Cache the results and add to found array
            for (const product of dbResults) {
                productCache.set(product.id, product);
                found.push(product);
                fromDatabase++;
            }

            // Identify missing products
            const foundIds = new Set(dbResults.map(p => p.id));
            for (const id of uncachedIds) {
                if (!foundIds.has(id)) {
                    missing.push(id);
                }
            }
        }

        return {
            found,
            missing,
            fromCache,
            fromDatabase
        };
    }

    /**
     * Batch fetch customers with caching
     */
    static async batchGetCustomers(customerIds: string[]): Promise<BatchQueryResult<any>> {
        const found: any[] = [];
        const missing: string[] = [];
        let fromCache = 0;
        let fromDatabase = 0;

        // Check cache first
        const uncachedIds: string[] = [];
        for (const id of customerIds) {
            const cached = customerCache.get(id);
            if (cached) {
                found.push(cached);
                fromCache++;
            } else {
                uncachedIds.push(id);
            }
        }

        // Fetch uncached customers from database
        if (uncachedIds.length > 0) {
            const queryStart = Date.now();

            const dbResults = await db
                .select()
                .from(customers)
                .where(inArray(customers.id, uncachedIds));

            const queryTime = Date.now() - queryStart;
            console.log(`[DB_OPTIMIZER] Batch customer query took ${queryTime}ms for ${uncachedIds.length} IDs`);

            // Cache the results and add to found array
            for (const customer of dbResults) {
                customerCache.set(customer.id, customer);
                found.push(customer);
                fromDatabase++;
            }

            // Identify missing customers
            const foundIds = new Set(dbResults.map(c => c.id));
            for (const id of uncachedIds) {
                if (!foundIds.has(id)) {
                    missing.push(id);
                }
            }
        }

        return {
            found,
            missing,
            fromCache,
            fromDatabase
        };
    }

    /**
     * Optimized single product fetch with prepared statement simulation
     */
    static async getOptimizedProduct(productId: string): Promise<any | null> {
        // Check cache first
        const cached = productCache.get(productId);
        if (cached) {
            return cached;
        }

        const queryStart = Date.now();

        // Use optimized query with specific field selection
        const result = await db
            .select({
                id: products.id,
                code: products.code,
                name: products.name,
                unit: products.unit,
                salePrice: products.salePrice,
                purchasePrice: products.purchasePrice,
                description: products.description,
                stock: products.stock,
                saleType: products.saleType,
                createdAt: products.createdAt,
                updatedAt: products.updatedAt
            })
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

        const queryTime = Date.now() - queryStart;
        console.log(`[DB_OPTIMIZER] Optimized product query took ${queryTime}ms`);

        if (result.length === 0) {
            return null;
        }

        const product = result[0];

        // Cache the result
        productCache.set(productId, product);

        return product;
    }

    /**
     * Optimized single customer fetch with prepared statement simulation
     */
    static async getOptimizedCustomer(customerId: string): Promise<any | null> {
        // Check cache first
        const cached = customerCache.get(customerId);
        if (cached) {
            return cached;
        }

        const queryStart = Date.now();

        // Use optimized query with specific field selection
        const result = await db
            .select({
                id: customers.id,
                name: customers.name,
                email: customers.email,
                phone: customers.phone,
                cpf: customers.cpf,
                address: customers.address,
                createdAt: customers.createdAt,
                updatedAt: customers.updatedAt
            })
            .from(customers)
            .where(eq(customers.id, customerId))
            .limit(1);

        const queryTime = Date.now() - queryStart;
        console.log(`[DB_OPTIMIZER] Optimized customer query took ${queryTime}ms`);

        if (result.length === 0) {
            return null;
        }

        const customer = result[0];

        // Cache the result
        customerCache.set(customerId, customer);

        return customer;
    }

    /**
     * Preload frequently accessed products into cache
     */
    static async preloadPopularProducts(limit: number = 50): Promise<void> {
        console.log(`[DB_OPTIMIZER] Preloading ${limit} popular products...`);

        const queryStart = Date.now();

        // In a real implementation, this would query based on access frequency
        // For now, we'll just load the most recently created products
        const popularProducts = await db
            .select()
            .from(products)
            .orderBy(products.createdAt)
            .limit(limit);

        const queryTime = Date.now() - queryStart;
        console.log(`[DB_OPTIMIZER] Preload query took ${queryTime}ms for ${popularProducts.length} products`);

        // Cache all the products
        for (const product of popularProducts) {
            productCache.set(product.id, product);
        }

        console.log(`[DB_OPTIMIZER] Preloaded ${popularProducts.length} products into cache`);
    }

    /**
     * Preload frequently accessed customers into cache
     */
    static async preloadActiveCustomers(limit: number = 100): Promise<void> {
        console.log(`[DB_OPTIMIZER] Preloading ${limit} active customers...`);

        const queryStart = Date.now();

        // In a real implementation, this would query based on recent activity
        // For now, we'll just load the most recently created customers
        const activeCustomers = await db
            .select()
            .from(customers)
            .orderBy(customers.createdAt)
            .limit(limit);

        const queryTime = Date.now() - queryStart;
        console.log(`[DB_OPTIMIZER] Preload query took ${queryTime}ms for ${activeCustomers.length} customers`);

        // Cache all the customers
        for (const customer of activeCustomers) {
            customerCache.set(customer.id, customer);
        }

        console.log(`[DB_OPTIMIZER] Preloaded ${activeCustomers.length} customers into cache`);
    }

    /**
     * Analyze query performance and suggest optimizations
     */
    static analyzeQueryPerformance(): {
        recommendations: string[];
        cacheStats: any;
    } {
        const recommendations: string[] = [];

        // Get cache statistics
        const productStats = productCache.getStats();
        const customerStats = customerCache.getStats();

        // Analyze product cache performance
        if (productStats.hitRate < 70) {
            recommendations.push('Product cache hit rate is low. Consider increasing cache TTL or preloading popular products.');
        }

        if (productStats.totalEntries < 50) {
            recommendations.push('Product cache has few entries. Consider preloading frequently accessed products.');
        }

        // Analyze customer cache performance
        if (customerStats.hitRate < 60) {
            recommendations.push('Customer cache hit rate is low. Consider increasing cache TTL or preloading active customers.');
        }

        // Memory usage recommendations
        const totalMemory = productStats.memoryUsage + customerStats.memoryUsage;
        if (totalMemory > 10 * 1024 * 1024) { // 10MB
            recommendations.push('Cache memory usage is high. Consider reducing cache size or TTL.');
        }

        return {
            recommendations,
            cacheStats: {
                product: productStats,
                customer: customerStats,
                totalMemoryMB: Math.round(totalMemory / 1024 / 1024 * 100) / 100
            }
        };
    }

    /**
     * Warm up caches with frequently accessed data
     */
    static async warmUpCaches(): Promise<void> {
        console.log('[DB_OPTIMIZER] Starting cache warm-up...');

        try {
            await Promise.all([
                this.preloadPopularProducts(50),
                this.preloadActiveCustomers(100)
            ]);

            console.log('[DB_OPTIMIZER] Cache warm-up completed successfully');
        } catch (error) {
            console.error('[DB_OPTIMIZER] Cache warm-up failed:', error);
        }
    }

    /**
     * Monitor database connection health
     */
    static async checkDatabaseHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        responseTime: number;
        error?: string;
    }> {
        const start = Date.now();

        try {
            // Simple health check query
            await db.select().from(products).limit(1);

            const responseTime = Date.now() - start;

            return {
                status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'unhealthy',
                responseTime
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

// Schedule periodic cache warm-up
setInterval(async () => {
    try {
        await DatabaseOptimizer.warmUpCaches();
    } catch (error) {
        console.error('[DB_OPTIMIZER] Scheduled cache warm-up failed:', error);
    }
}, 30 * 60 * 1000); // Every 30 minutes

// Schedule periodic performance analysis
setInterval(() => {
    const analysis = DatabaseOptimizer.analyzeQueryPerformance();
    if (analysis.recommendations.length > 0) {
        console.log('[DB_OPTIMIZER] Performance recommendations:', analysis.recommendations);
    }
}, 15 * 60 * 1000); // Every 15 minutes