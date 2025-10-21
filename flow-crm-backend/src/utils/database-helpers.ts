import { drizzle } from 'drizzle-orm/node-postgres';
import { getDatabaseConnectionManager } from './database-connection-manager';

/**
 * Helper function to execute database operations with retry logic
 * This is a convenience wrapper for services that want to use retry logic
 */
export async function withDatabaseRetry<T>(
    operation: (db: ReturnType<typeof drizzle>) => Promise<T>,
    operationName?: string
): Promise<T> {
    try {
        const connectionManager = getDatabaseConnectionManager();
        return await connectionManager.executeWithRetry(operation, operationName);
    } catch (error) {
        // If connection manager is not available, this will throw an error
        // which is appropriate since we want to ensure retry logic is used
        throw error;
    }
}

/**
 * Helper function to get the database instance with connection manager
 */
export function getDatabase(): ReturnType<typeof drizzle> {
    const connectionManager = getDatabaseConnectionManager();
    return connectionManager.getDatabase();
}

/**
 * Helper function to check database health
 */
export async function checkDatabaseHealth() {
    const connectionManager = getDatabaseConnectionManager();
    return await connectionManager.checkHealth();
}

/**
 * Helper function to get connection pool statistics
 */
export function getConnectionPoolStats() {
    const connectionManager = getDatabaseConnectionManager();
    return connectionManager.getPoolStats();
}