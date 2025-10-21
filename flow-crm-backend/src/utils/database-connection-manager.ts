import { Pool, PoolClient, PoolConfig } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { databaseConfig } from '../config/database';
import { createDatabaseError, isPostgresError } from './database-error-handler';

/**
 * Configuration for retry logic
 */
export interface RetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    retryableErrorCodes: string[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableErrorCodes: [
        '08000', // connection_exception
        '08003', // connection_does_not_exist
        '08006', // connection_failure
        '08001', // sqlclient_unable_to_establish_sqlconnection
        '08004', // sqlserver_rejected_establishment_of_sqlconnection
        '53300', // too_many_connections
        '57P01', // admin_shutdown
        '57P02', // crash_shutdown
        '57P03', // cannot_connect_now
    ],
};

/**
 * Connection health status
 */
export interface ConnectionHealth {
    isHealthy: boolean;
    connectionCount: number;
    idleCount: number;
    waitingCount: number;
    lastError?: string;
    lastHealthCheck: Date;
}

/**
 * Database connection manager with retry logic and health monitoring
 */
export class DatabaseConnectionManager {
    private pool: Pool;
    private db: ReturnType<typeof drizzle>;
    private retryConfig: RetryConfig;
    private isShuttingDown = false;
    private healthCheckInterval?: NodeJS.Timeout;

    constructor(config?: Partial<PoolConfig>, retryConfig?: Partial<RetryConfig>) {
        const poolConfig: PoolConfig = {
            ...databaseConfig,
            ...config,
            // Enhanced timeout and connection settings
            connectionTimeoutMillis: config?.connectionTimeoutMillis || 5000,
            idleTimeoutMillis: config?.idleTimeoutMillis || 30000,
            max: config?.max || 20,
            // Note: Some pool options are not available in the pg PoolConfig type
            // but are supported by the underlying pool implementation
        };

        this.pool = new Pool(poolConfig);
        this.db = drizzle(this.pool, { schema });
        this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

        this.setupPoolEventHandlers();
        this.startHealthMonitoring();
    }

    /**
     * Setup event handlers for the connection pool
     */
    private setupPoolEventHandlers(): void {
        this.pool.on('connect', (client: PoolClient) => {
            console.log('Database client connected');
        });

        this.pool.on('acquire', (client: PoolClient) => {
            console.debug('Database client acquired from pool');
        });

        this.pool.on('release', (err: Error | undefined, client: PoolClient) => {
            if (err) {
                console.error('Database client released with error:', err);
            } else {
                console.debug('Database client released back to pool');
            }
        });

        this.pool.on('remove', (client: PoolClient) => {
            console.log('Database client removed from pool');
        });

        this.pool.on('error', (err: Error, client: PoolClient) => {
            console.error('Database pool error:', err);
            // Don't exit the process, let the retry logic handle it
        });
    }

    /**
     * Start periodic health monitoring
     */
    private startHealthMonitoring(): void {
        // Check health every 30 seconds
        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.checkHealth();
            } catch (error) {
                console.error('Health check failed:', error);
            }
        }, 30000);
    }

    /**
     * Execute a database operation with retry logic
     */
    async executeWithRetry<T>(
        operation: (db: ReturnType<typeof drizzle>) => Promise<T>,
        operationName = 'database operation'
    ): Promise<T> {
        let lastError: Error | null = null;
        let delay = this.retryConfig.initialDelayMs;

        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                if (this.isShuttingDown) {
                    throw new Error('Database connection manager is shutting down');
                }

                return await operation(this.db);
            } catch (error) {
                lastError = error as Error;

                // Don't retry on the last attempt
                if (attempt === this.retryConfig.maxRetries) {
                    break;
                }

                // Check if error is retryable
                if (!this.isRetryableError(error)) {
                    console.log(`Non-retryable error in ${operationName}, not retrying:`, error);
                    break;
                }

                console.warn(
                    `${operationName} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), retrying in ${delay}ms:`,
                    error
                );

                // Wait before retrying
                await this.sleep(delay);

                // Exponential backoff with jitter
                delay = Math.min(
                    delay * this.retryConfig.backoffMultiplier + Math.random() * 1000,
                    this.retryConfig.maxDelayMs
                );
            }
        }

        // All retries exhausted, throw the last error
        if (!lastError) {
            lastError = new Error(`${operationName} failed after ${this.retryConfig.maxRetries + 1} attempts`);
        }

        console.error(`${operationName} failed after ${this.retryConfig.maxRetries + 1} attempts:`, lastError);

        if (isPostgresError(lastError)) {
            throw createDatabaseError(lastError);
        }

        throw lastError;
    }

    /**
     * Check if an error is retryable based on error codes
     */
    private isRetryableError(error: any): boolean {
        // Check for PostgreSQL error codes
        if (isPostgresError(error)) {
            return this.retryConfig.retryableErrorCodes.includes(error.code || '');
        }

        // Check for common connection error patterns
        const errorMessage = error.message?.toLowerCase() || '';
        const retryablePatterns = [
            'connection terminated',
            'connection refused',
            'connection timeout',
            'connection reset',
            'network error',
            'timeout',
            'econnreset',
            'econnrefused',
            'enotfound',
            'etimedout',
            'pool is ending',
            'client has encountered a connection error',
        ];

        return retryablePatterns.some(pattern => errorMessage.includes(pattern));
    }

    /**
     * Sleep for specified milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check database connection health
     */
    async checkHealth(): Promise<ConnectionHealth> {
        try {
            const start = Date.now();
            await this.pool.query('SELECT 1');
            const responseTime = Date.now() - start;

            const health: ConnectionHealth = {
                isHealthy: true,
                connectionCount: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount,
                lastHealthCheck: new Date(),
            };

            if (responseTime > 5000) {
                console.warn(`Database health check slow: ${responseTime}ms`);
            }

            return health;
        } catch (error) {
            console.error('Database health check failed:', error);

            return {
                isHealthy: false,
                connectionCount: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount,
                lastError: error instanceof Error ? error.message : 'Unknown error',
                lastHealthCheck: new Date(),
            };
        }
    }

    /**
     * Get the Drizzle database instance
     */
    getDatabase(): ReturnType<typeof drizzle> {
        return this.db;
    }

    /**
     * Get the raw connection pool
     */
    getPool(): Pool {
        return this.pool;
    }

    /**
     * Get connection pool statistics
     */
    getPoolStats() {
        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount,
        };
    }

    /**
     * Gracefully shutdown the connection manager
     */
    async shutdown(): Promise<void> {
        console.log('Shutting down database connection manager...');
        this.isShuttingDown = true;

        // Stop health monitoring
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        try {
            // Wait for active connections to finish (with timeout)
            const shutdownTimeout = 10000; // 10 seconds
            const shutdownPromise = this.pool.end();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Shutdown timeout')), shutdownTimeout)
            );

            await Promise.race([shutdownPromise, timeoutPromise]);
            console.log('Database connection manager shut down successfully');
        } catch (error) {
            console.error('Error during database shutdown:', error);
            // Force close if graceful shutdown fails
            await this.pool.end();
        }
    }

    /**
     * Test database connectivity with retry
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.executeWithRetry(
                async (db) => {
                    await this.pool.query('SELECT 1');
                },
                'connection test'
            );
            return true;
        } catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    }
}

/**
 * Create a singleton database connection manager instance
 */
let connectionManager: DatabaseConnectionManager | null = null;

export function createDatabaseConnectionManager(
    config?: Partial<PoolConfig>,
    retryConfig?: Partial<RetryConfig>
): DatabaseConnectionManager {
    if (connectionManager) {
        throw new Error('Database connection manager already exists');
    }

    connectionManager = new DatabaseConnectionManager(config, retryConfig);
    return connectionManager;
}

export function getDatabaseConnectionManager(): DatabaseConnectionManager {
    if (!connectionManager) {
        throw new Error('Database connection manager not initialized');
    }

    return connectionManager;
}

/**
 * Shutdown the singleton connection manager
 */
export async function shutdownDatabaseConnectionManager(): Promise<void> {
    if (connectionManager) {
        await connectionManager.shutdown();
        connectionManager = null;
    }
}