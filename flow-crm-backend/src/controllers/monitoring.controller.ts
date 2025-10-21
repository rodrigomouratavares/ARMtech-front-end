/**
 * Monitoring Controller
 * Provides endpoints for monitoring cache performance, database health, and system metrics
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { CacheMonitor } from '../utils/cache-manager';
import { DatabaseOptimizer } from '../utils/database-optimizer';
import { auditLogger } from '../utils/audit-logger';
import { sendSuccess, sendInternalError } from '../utils/response-helpers';

/**
 * Monitoring controller for system health and performance metrics
 */
export class MonitoringController {
    /**
     * Get comprehensive cache statistics
     * GET /api/monitoring/cache-stats
     */
    async getCacheStats(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const stats = CacheMonitor.getAllStats();

            return sendSuccess(reply, {
                caches: stats,
                timestamp: new Date().toISOString(),
                recommendations: this.generateCacheRecommendations(stats)
            }, 'Cache statistics retrieved successfully');
        } catch (error) {
            console.error('Error retrieving cache stats:', error);
            return sendInternalError(reply, 'Failed to retrieve cache statistics');
        }
    }

    /**
     * Get database performance metrics
     * GET /api/monitoring/database-health
     */
    async getDatabaseHealth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const health = await DatabaseOptimizer.checkDatabaseHealth();
            const analysis = DatabaseOptimizer.analyzeQueryPerformance();

            return sendSuccess(reply, {
                health,
                analysis,
                timestamp: new Date().toISOString()
            }, 'Database health retrieved successfully');
        } catch (error) {
            console.error('Error checking database health:', error);
            return sendInternalError(reply, 'Failed to check database health');
        }
    }

    /**
     * Get audit log statistics
     * GET /api/monitoring/audit-stats
     */
    async getAuditStats(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const stats = auditLogger.getAuditStats();

            return sendSuccess(reply, {
                audit: stats,
                timestamp: new Date().toISOString()
            }, 'Audit statistics retrieved successfully');
        } catch (error) {
            console.error('Error retrieving audit stats:', error);
            return sendInternalError(reply, 'Failed to retrieve audit statistics');
        }
    }

    /**
     * Get comprehensive system metrics
     * GET /api/monitoring/system-metrics
     */
    async getSystemMetrics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const cacheStats = CacheMonitor.getAllStats();
            const dbHealth = await DatabaseOptimizer.checkDatabaseHealth();
            const auditStats = auditLogger.getAuditStats();
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();

            const metrics = {
                system: {
                    uptime: Math.round(uptime),
                    uptimeFormatted: this.formatUptime(uptime),
                    memory: {
                        rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100, // MB
                        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
                        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
                        external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100 // MB
                    },
                    nodeVersion: process.version,
                    platform: process.platform,
                    arch: process.arch
                },
                cache: cacheStats,
                database: dbHealth,
                audit: auditStats,
                timestamp: new Date().toISOString(),
                recommendations: [
                    ...this.generateCacheRecommendations(cacheStats),
                    ...this.generateSystemRecommendations(memoryUsage, uptime)
                ]
            };

            return sendSuccess(reply, metrics, 'System metrics retrieved successfully');
        } catch (error) {
            console.error('Error retrieving system metrics:', error);
            return sendInternalError(reply, 'Failed to retrieve system metrics');
        }
    }

    /**
     * Clear all caches
     * POST /api/monitoring/clear-caches
     */
    async clearCaches(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            CacheMonitor.clearAllCaches();

            return sendSuccess(reply, {
                message: 'All caches cleared successfully',
                timestamp: new Date().toISOString()
            }, 'Caches cleared successfully');
        } catch (error) {
            console.error('Error clearing caches:', error);
            return sendInternalError(reply, 'Failed to clear caches');
        }
    }

    /**
     * Warm up caches with frequently accessed data
     * POST /api/monitoring/warm-up-caches
     */
    async warmUpCaches(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            await DatabaseOptimizer.warmUpCaches();

            return sendSuccess(reply, {
                message: 'Cache warm-up completed successfully',
                timestamp: new Date().toISOString()
            }, 'Cache warm-up completed');
        } catch (error) {
            console.error('Error warming up caches:', error);
            return sendInternalError(reply, 'Failed to warm up caches');
        }
    }

    /**
     * Generate cache performance recommendations
     */
    private generateCacheRecommendations(stats: any): string[] {
        const recommendations: string[] = [];

        // Product cache recommendations
        if (stats.product.hitRate < 70) {
            recommendations.push('Product cache hit rate is below 70%. Consider increasing TTL or preloading popular products.');
        }

        if (stats.product.totalEntries < 10) {
            recommendations.push('Product cache has very few entries. Consider preloading frequently accessed products.');
        }

        // Customer cache recommendations
        if (stats.customer.hitRate < 60) {
            recommendations.push('Customer cache hit rate is below 60%. Consider increasing TTL or preloading active customers.');
        }

        // Calculation cache recommendations
        if (stats.calculation.hitRate < 30) {
            recommendations.push('Calculation cache hit rate is low. This is normal for unique calculations but monitor for patterns.');
        }

        // Memory usage recommendations
        if (stats.totalMemoryUsage > 50 * 1024 * 1024) { // 50MB
            recommendations.push('Cache memory usage is high. Consider reducing cache sizes or TTL values.');
        }

        return recommendations;
    }

    /**
     * Generate system performance recommendations
     */
    private generateSystemRecommendations(memoryUsage: NodeJS.MemoryUsage, uptime: number): string[] {
        const recommendations: string[] = [];

        // Memory recommendations
        const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
        if (heapUsedMB > 500) { // 500MB
            recommendations.push('High heap memory usage detected. Consider optimizing memory usage or increasing available memory.');
        }

        // Uptime recommendations
        if (uptime > 7 * 24 * 60 * 60) { // 7 days
            recommendations.push('Application has been running for over 7 days. Consider scheduled restarts for optimal performance.');
        }

        return recommendations;
    }

    /**
     * Format uptime in human-readable format
     */
    private formatUptime(seconds: number): string {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const secs = Math.floor(seconds % 60);

        const parts: string[] = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0) parts.push(`${secs}s`);

        return parts.join(' ') || '0s';
    }
}

// Export singleton instance
export const monitoringController = new MonitoringController();