/**
 * Audit Logger Utility
 * Provides comprehensive logging and monitoring for price calculations
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Interface for audit log entry
 */
export interface AuditLogEntry {
    requestId: string;
    timestamp: Date;
    method: string;
    userId?: string;
    sessionId?: string;
    ip: string;
    userAgent?: string;
    parameters: Record<string, any>;
    result?: Record<string, any>;
    duration: number;
    status: 'success' | 'error' | 'validation_error';
    error?: {
        message: string;
        code?: string;
        stack?: string;
    };
}

/**
 * Interface for performance metrics
 */
export interface PerformanceMetrics {
    requestId: string;
    timestamp: Date;
    method: string;
    duration: number;
    memoryUsage: {
        rss: number;
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    responseSize?: number;
    dbQueryCount?: number;
    dbQueryTime?: number;
}

/**
 * Interface for rate limiting metrics
 */
export interface RateLimitMetrics {
    ip: string;
    timestamp: Date;
    requestCount: number;
    windowStart: Date;
    blocked: boolean;
}

/**
 * Audit Logger class for comprehensive logging and monitoring
 */
export class AuditLogger {
    private logDir: string;
    private auditLogFile: string;
    private performanceLogFile: string;
    private rateLimitLogFile: string;
    private errorLogFile: string;
    private retentionDays: number;
    private cleanupInterval?: NodeJS.Timeout;

    constructor(options: {
        logDir?: string;
        retentionDays?: number;
    } = {}) {
        this.logDir = options.logDir || join(process.cwd(), 'logs');
        this.retentionDays = options.retentionDays || 90;

        // Ensure log directory exists
        if (!existsSync(this.logDir)) {
            mkdirSync(this.logDir, { recursive: true });
        }

        // Define log file paths
        this.auditLogFile = join(this.logDir, 'price-audit.log');
        this.performanceLogFile = join(this.logDir, 'price-performance.log');
        this.rateLimitLogFile = join(this.logDir, 'rate-limit.log');
        this.errorLogFile = join(this.logDir, 'price-errors.log');

        // Initialize log files if they don't exist
        this.initializeLogFiles();
    }

    /**
     * Initialize log files with headers
     */
    private initializeLogFiles(): void {
        const auditHeader = 'timestamp,requestId,method,userId,sessionId,ip,userAgent,parameters,result,duration,status,error\n';
        const performanceHeader = 'timestamp,requestId,method,duration,memoryRSS,memoryHeapUsed,memoryHeapTotal,memoryExternal,responseSize,dbQueryCount,dbQueryTime\n';
        const rateLimitHeader = 'timestamp,ip,requestCount,windowStart,blocked\n';
        const errorHeader = 'timestamp,requestId,method,error,stack,parameters\n';

        if (!existsSync(this.auditLogFile)) {
            writeFileSync(this.auditLogFile, auditHeader);
        }

        if (!existsSync(this.performanceLogFile)) {
            writeFileSync(this.performanceLogFile, performanceHeader);
        }

        if (!existsSync(this.rateLimitLogFile)) {
            writeFileSync(this.rateLimitLogFile, rateLimitHeader);
        }

        if (!existsSync(this.errorLogFile)) {
            writeFileSync(this.errorLogFile, errorHeader);
        }
    }

    /**
     * Log audit entry for price calculation
     */
    logAudit(entry: AuditLogEntry): void {
        try {
            const csvLine = [
                entry.timestamp.toISOString(),
                entry.requestId,
                entry.method,
                entry.userId || '',
                entry.sessionId || '',
                entry.ip,
                this.escapeCsv(entry.userAgent || ''),
                this.escapeCsv(JSON.stringify(entry.parameters)),
                this.escapeCsv(JSON.stringify(entry.result || {})),
                entry.duration,
                entry.status,
                this.escapeCsv(JSON.stringify(entry.error || {}))
            ].join(',') + '\n';

            appendFileSync(this.auditLogFile, csvLine);

            // Also log to console for development
            console.log(`[AUDIT] ${entry.requestId} - ${entry.method} - ${entry.status} - ${entry.duration}ms`);
        } catch (error) {
            console.error('Failed to write audit log:', error);
        }
    }

    /**
     * Log performance metrics
     */
    logPerformance(metrics: PerformanceMetrics): void {
        try {
            const csvLine = [
                metrics.timestamp.toISOString(),
                metrics.requestId,
                metrics.method,
                metrics.duration,
                metrics.memoryUsage.rss,
                metrics.memoryUsage.heapUsed,
                metrics.memoryUsage.heapTotal,
                metrics.memoryUsage.external,
                metrics.responseSize || 0,
                metrics.dbQueryCount || 0,
                metrics.dbQueryTime || 0
            ].join(',') + '\n';

            appendFileSync(this.performanceLogFile, csvLine);

            // Log performance warnings
            if (metrics.duration > 2000) {
                console.warn(`[PERFORMANCE] Slow request detected: ${metrics.requestId} - ${metrics.duration}ms`);
            }

            if (metrics.memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
                console.warn(`[PERFORMANCE] High memory usage: ${metrics.requestId} - ${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`);
            }
        } catch (error) {
            console.error('Failed to write performance log:', error);
        }
    }

    /**
     * Log rate limiting metrics
     */
    logRateLimit(metrics: RateLimitMetrics): void {
        try {
            const csvLine = [
                metrics.timestamp.toISOString(),
                metrics.ip,
                metrics.requestCount,
                metrics.windowStart.toISOString(),
                metrics.blocked
            ].join(',') + '\n';

            appendFileSync(this.rateLimitLogFile, csvLine);

            if (metrics.blocked) {
                console.warn(`[RATE_LIMIT] IP blocked: ${metrics.ip} - ${metrics.requestCount} requests`);
            }
        } catch (error) {
            console.error('Failed to write rate limit log:', error);
        }
    }

    /**
     * Log error details
     */
    logError(requestId: string, method: string, error: Error, parameters?: Record<string, any>): void {
        try {
            const csvLine = [
                new Date().toISOString(),
                requestId,
                method,
                this.escapeCsv(error.message),
                this.escapeCsv(error.stack || ''),
                this.escapeCsv(JSON.stringify(parameters || {}))
            ].join(',') + '\n';

            appendFileSync(this.errorLogFile, csvLine);

            // Also log to console
            console.error(`[ERROR] ${requestId} - ${method} - ${error.message}`);
        } catch (logError) {
            console.error('Failed to write error log:', logError);
        }
    }

    /**
     * Escape CSV values to prevent injection and formatting issues
     */
    private escapeCsv(value: string): string {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }

    /**
     * Clean up old log files based on retention policy
     */
    async cleanupOldLogs(): Promise<void> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

            // In a production environment, you would implement log rotation
            // and cleanup based on file dates. For now, we'll just log the action.
            console.log(`[CLEANUP] Log cleanup would remove files older than ${cutoffDate.toISOString()}`);

            // TODO: Implement actual log rotation and cleanup
            // This could involve:
            // 1. Reading log files and filtering out old entries
            // 2. Archiving old logs to compressed files
            // 3. Removing archived files older than retention period
            // 4. Using external log rotation tools like logrotate
        } catch (error) {
            console.error('Failed to cleanup old logs:', error);
        }
    }

    /**
     * Get audit statistics for monitoring dashboard
     */
    getAuditStats(): {
        totalRequests: number;
        successRate: number;
        averageResponseTime: number;
        errorRate: number;
    } {
        // In a production environment, this would read from log files
        // or a dedicated metrics database. For now, return placeholder values.
        return {
            totalRequests: 0,
            successRate: 0,
            averageResponseTime: 0,
            errorRate: 0
        };
    }

    /**
     * Destroy audit logger and cleanup resources
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

/**
 * Singleton instance of audit logger
 */
export const auditLogger = new AuditLogger({
    retentionDays: 90
});

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
    private static requestMetrics = new Map<string, {
        startTime: number;
        startMemory: NodeJS.MemoryUsage;
        dbQueryCount: number;
        dbQueryTime: number;
    }>();

    /**
     * Start monitoring a request
     */
    static startRequest(requestId: string): void {
        this.requestMetrics.set(requestId, {
            startTime: Date.now(),
            startMemory: process.memoryUsage(),
            dbQueryCount: 0,
            dbQueryTime: 0
        });
    }

    /**
     * Record database query metrics
     */
    static recordDbQuery(requestId: string, queryTime: number): void {
        const metrics = this.requestMetrics.get(requestId);
        if (metrics) {
            metrics.dbQueryCount++;
            metrics.dbQueryTime += queryTime;
        }
    }

    /**
     * End monitoring and log performance metrics
     */
    static endRequest(requestId: string, method: string, responseSize?: number): void {
        const metrics = this.requestMetrics.get(requestId);
        if (!metrics) {
            return;
        }

        const duration = Date.now() - metrics.startTime;
        const currentMemory = process.memoryUsage();

        const performanceMetrics: PerformanceMetrics = {
            requestId,
            timestamp: new Date(),
            method,
            duration,
            memoryUsage: currentMemory,
            responseSize,
            dbQueryCount: metrics.dbQueryCount,
            dbQueryTime: metrics.dbQueryTime
        };

        auditLogger.logPerformance(performanceMetrics);

        // Clean up metrics
        this.requestMetrics.delete(requestId);
    }
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
    private static requestCounts = new Map<string, {
        count: number;
        windowStart: Date;
    }>();

    private static readonly WINDOW_SIZE_MS = 60 * 1000; // 1 minute
    private static readonly MAX_REQUESTS = 100; // 100 requests per minute

    /**
     * Check if request should be rate limited
     */
    static shouldLimit(ip: string): boolean {
        const now = new Date();
        const existing = this.requestCounts.get(ip);

        if (!existing || (now.getTime() - existing.windowStart.getTime()) > this.WINDOW_SIZE_MS) {
            // New window or first request
            this.requestCounts.set(ip, {
                count: 1,
                windowStart: now
            });

            auditLogger.logRateLimit({
                ip,
                timestamp: now,
                requestCount: 1,
                windowStart: now,
                blocked: false
            });

            return false;
        }

        // Increment count
        existing.count++;

        const blocked = existing.count > this.MAX_REQUESTS;

        auditLogger.logRateLimit({
            ip,
            timestamp: now,
            requestCount: existing.count,
            windowStart: existing.windowStart,
            blocked
        });

        return blocked;
    }

    /**
     * Clean up old rate limit entries
     */
    static cleanup(): void {
        const now = new Date();
        const cutoff = now.getTime() - this.WINDOW_SIZE_MS;

        for (const [ip, data] of this.requestCounts.entries()) {
            if (data.windowStart.getTime() < cutoff) {
                this.requestCounts.delete(ip);
            }
        }
    }
}

// Schedule periodic cleanup
setInterval(() => {
    RateLimiter.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes