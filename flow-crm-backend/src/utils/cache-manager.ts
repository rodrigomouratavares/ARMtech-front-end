/**
 * Cache Manager Utility
 * Provides in-memory caching for frequently accessed data with TTL support
 */

/**
 * Interface for cache entry
 */
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
}

/**
 * Interface for cache statistics
 */
export interface CacheStats {
    totalEntries: number;
    hitCount: number;
    missCount: number;
    hitRate: number;
    memoryUsage: number;
    oldestEntry?: Date;
    newestEntry?: Date;
}

/**
 * Cache Manager class with TTL support and performance monitoring
 */
export class CacheManager<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private hitCount = 0;
    private missCount = 0;
    private maxSize: number;
    private defaultTtl: number;
    private cleanupInterval: NodeJS.Timeout;

    constructor(options: {
        maxSize?: number;
        defaultTtl?: number; // in milliseconds
        cleanupInterval?: number; // in milliseconds
    } = {}) {
        this.maxSize = options.maxSize || 1000;
        this.defaultTtl = options.defaultTtl || 5 * 60 * 1000; // 5 minutes default

        // Start cleanup interval
        const cleanupIntervalMs = options.cleanupInterval || 60 * 1000; // 1 minute default
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, cleanupIntervalMs);
    }

    /**
     * Get value from cache
     */
    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.missCount++;
            return null;
        }

        // Check if entry has expired
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.missCount++;
            return null;
        }

        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = now;
        this.hitCount++;

        return entry.data;
    }

    /**
     * Set value in cache
     */
    set(key: string, value: T, ttl?: number): void {
        const now = Date.now();
        const entryTtl = ttl || this.defaultTtl;

        // Check if cache is full and needs eviction
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictLeastRecentlyUsed();
        }

        const entry: CacheEntry<T> = {
            data: value,
            timestamp: now,
            ttl: entryTtl,
            accessCount: 0,
            lastAccessed: now
        };

        this.cache.set(key, entry);
    }

    /**
     * Delete value from cache
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Check if key exists in cache (without updating access stats)
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }

        // Check if entry has expired
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.hitCount = 0;
        this.missCount = 0;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const entries = Array.from(this.cache.values());
        const totalRequests = this.hitCount + this.missCount;

        let oldestTimestamp = Date.now();
        let newestTimestamp = 0;
        let memoryUsage = 0;

        for (const entry of entries) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
            }
            if (entry.timestamp > newestTimestamp) {
                newestTimestamp = entry.timestamp;
            }

            // Rough memory usage calculation
            memoryUsage += JSON.stringify(entry.data).length + 100; // 100 bytes overhead per entry
        }

        return {
            totalEntries: this.cache.size,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
            memoryUsage,
            oldestEntry: entries.length > 0 ? new Date(oldestTimestamp) : undefined,
            newestEntry: entries.length > 0 ? new Date(newestTimestamp) : undefined
        };
    }

    /**
     * Get or set pattern - get from cache or compute and cache
     */
    async getOrSet<R>(
        key: string,
        computeFn: () => Promise<R>,
        ttl?: number
    ): Promise<R> {
        // Try to get from cache first
        const cached = this.get(key);
        if (cached !== null) {
            return cached as unknown as R;
        }

        // Compute value and cache it
        const computed = await computeFn();
        this.set(key, computed as unknown as T, ttl);

        return computed;
    }

    /**
     * Cleanup expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        }

        for (const key of keysToDelete) {
            this.cache.delete(key);
        }

        if (keysToDelete.length > 0) {
            console.log(`[CACHE] Cleaned up ${keysToDelete.length} expired entries`);
        }
    }

    /**
     * Evict least recently used entry when cache is full
     */
    private evictLeastRecentlyUsed(): void {
        let lruKey: string | null = null;
        let lruTime = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < lruTime) {
                lruTime = entry.lastAccessed;
                lruKey = key;
            }
        }

        if (lruKey) {
            this.cache.delete(lruKey);
            console.log(`[CACHE] Evicted LRU entry: ${lruKey}`);
        }
    }

    /**
     * Destroy cache manager and cleanup intervals
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

/**
 * Product cache for frequently accessed product data
 */
export const productCache = new CacheManager<any>({
    maxSize: 1000, // Increased from 500
    defaultTtl: 15 * 60 * 1000, // Increased to 15 minutes
    cleanupInterval: 2 * 60 * 1000 // 2 minutes
});

/**
 * Customer cache for frequently accessed customer data
 */
export const customerCache = new CacheManager<any>({
    maxSize: 500, // Increased from 200
    defaultTtl: 30 * 60 * 1000, // Increased to 30 minutes
    cleanupInterval: 5 * 60 * 1000 // 5 minutes
});

/**
 * Price calculation cache for identical requests
 */
export const calculationCache = new CacheManager<any>({
    maxSize: 100,
    defaultTtl: 1 * 60 * 1000, // 1 minute (short TTL for price calculations)
    cleanupInterval: 30 * 1000 // 30 seconds
});

/**
 * Promotion cache for active promotions
 */
export const promotionCache = new CacheManager<any>({
    maxSize: 50,
    defaultTtl: 2 * 60 * 1000, // 2 minutes
    cleanupInterval: 60 * 1000 // 1 minute
});

/**
 * Generate cache key for price calculations
 */
export function generateCalculationCacheKey(params: {
    productId: string;
    quantity: number;
    basePrice?: number;
    customerId?: string;
    applyPromotions?: boolean;
    includeTaxes?: boolean;
}): string {
    const keyParts = [
        'calc',
        params.productId,
        params.quantity.toString(),
        params.basePrice?.toString() || 'default',
        params.customerId || 'no-customer',
        params.applyPromotions ? 'promo' : 'no-promo',
        params.includeTaxes ? 'tax' : 'no-tax'
    ];

    return keyParts.join(':');
}

/**
 * Generate cache key for margin/markup calculations
 */
export function generateMarginMarkupCacheKey(cost: number, sellingPrice: number): string {
    return `margin:${cost}:${sellingPrice}`;
}

/**
 * Generate cache key for price suggestions
 */
export function generateSuggestionCacheKey(params: {
    productId: string;
    targetMargin?: number;
    targetMarkup?: number;
    customerId?: string;
    quantity?: number;
}): string {
    const keyParts = [
        'suggest',
        params.productId,
        params.targetMargin?.toString() || 'no-margin',
        params.targetMarkup?.toString() || 'no-markup',
        params.customerId || 'no-customer',
        params.quantity?.toString() || '1'
    ];

    return keyParts.join(':');
}

/**
 * Cache monitoring utility
 */
export class CacheMonitor {
    /**
     * Get comprehensive cache statistics
     */
    static getAllStats(): {
        product: CacheStats;
        customer: CacheStats;
        calculation: CacheStats;
        promotion: CacheStats;
        totalMemoryUsage: number;
    } {
        const productStats = productCache.getStats();
        const customerStats = customerCache.getStats();
        const calculationStats = calculationCache.getStats();
        const promotionStats = promotionCache.getStats();

        return {
            product: productStats,
            customer: customerStats,
            calculation: calculationStats,
            promotion: promotionStats,
            totalMemoryUsage: productStats.memoryUsage +
                customerStats.memoryUsage +
                calculationStats.memoryUsage +
                promotionStats.memoryUsage
        };
    }

    /**
     * Log cache performance metrics
     */
    static logPerformanceMetrics(): void {
        const stats = this.getAllStats();

        console.log('[CACHE_MONITOR] Cache Performance Metrics:', {
            product: {
                entries: stats.product.totalEntries,
                hitRate: `${stats.product.hitRate.toFixed(2)}%`,
                memory: `${Math.round(stats.product.memoryUsage / 1024)}KB`
            },
            customer: {
                entries: stats.customer.totalEntries,
                hitRate: `${stats.customer.hitRate.toFixed(2)}%`,
                memory: `${Math.round(stats.customer.memoryUsage / 1024)}KB`
            },
            calculation: {
                entries: stats.calculation.totalEntries,
                hitRate: `${stats.calculation.hitRate.toFixed(2)}%`,
                memory: `${Math.round(stats.calculation.memoryUsage / 1024)}KB`
            },
            promotion: {
                entries: stats.promotion.totalEntries,
                hitRate: `${stats.promotion.hitRate.toFixed(2)}%`,
                memory: `${Math.round(stats.promotion.memoryUsage / 1024)}KB`
            },
            totalMemory: `${Math.round(stats.totalMemoryUsage / 1024)}KB`
        });
    }

    /**
     * Clear all caches
     */
    static clearAllCaches(): void {
        productCache.clear();
        customerCache.clear();
        calculationCache.clear();
        promotionCache.clear();
        console.log('[CACHE_MONITOR] All caches cleared');
    }
}

// Schedule periodic cache monitoring
setInterval(() => {
    CacheMonitor.logPerformanceMetrics();
}, 10 * 60 * 1000); // Every 10 minutes
/**

 * Cache preloader for warming up caches with popular data
 */
export class CachePreloader {
    /**
     * Preload popular products into cache
     */
    static async preloadPopularProducts(db: any): Promise<void> {
        try {
            // Get most accessed products (you can adjust this query based on your needs)
            const popularProducts = await db.select()
                .from('products')
                .limit(100); // Preload top 100 products

            for (const product of popularProducts) {
                const cacheKey = `product:${product.id}`;
                productCache.set(cacheKey, product, 30 * 60 * 1000); // 30 minutes TTL
            }

            console.log(`[CACHE_PRELOADER] Preloaded ${popularProducts.length} popular products`);
        } catch (error) {
            console.error('[CACHE_PRELOADER] Error preloading products:', error);
        }
    }

    /**
     * Preload active customers into cache
     */
    static async preloadActiveCustomers(db: any): Promise<void> {
        try {
            // Get most active customers (you can adjust this query based on your needs)
            const activeCustomers = await db.select()
                .from('customers')
                .limit(50); // Preload top 50 customers

            for (const customer of activeCustomers) {
                const cacheKey = `customer:${customer.id}`;
                customerCache.set(cacheKey, customer, 60 * 60 * 1000); // 1 hour TTL
            }

            console.log(`[CACHE_PRELOADER] Preloaded ${activeCustomers.length} active customers`);
        } catch (error) {
            console.error('[CACHE_PRELOADER] Error preloading customers:', error);
        }
    }

    /**
     * Preload all popular data
     */
    static async preloadAll(db: any): Promise<void> {
        console.log('[CACHE_PRELOADER] Starting cache preloading...');

        await Promise.all([
            this.preloadPopularProducts(db),
            this.preloadActiveCustomers(db)
        ]);

        console.log('[CACHE_PRELOADER] Cache preloading completed');
    }
}

// Schedule cache preloading every hour
setInterval(async () => {
    // Note: You'll need to pass the database instance here
    // This is just a placeholder - implement based on your app structure
    console.log('[CACHE_PRELOADER] Scheduled cache refresh triggered');
}, 60 * 60 * 1000); // Every hour