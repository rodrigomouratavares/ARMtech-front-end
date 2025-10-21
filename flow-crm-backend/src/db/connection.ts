import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/environment';
import * as schema from './schema';
import { getDatabaseConnectionManager } from '../utils/database-connection-manager';

// Legacy connection for backward compatibility
// Note: In production, use the connection manager from the database plugin
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Create Drizzle database instance
export const db = drizzle(pool, { schema });

/**
 * Get database instance from connection manager (preferred method)
 */
export const getDatabase = () => {
  try {
    const connectionManager = getDatabaseConnectionManager();
    return connectionManager.getDatabase();
  } catch (error) {
    // Fallback to legacy connection if connection manager not available
    console.warn('Connection manager not available, using legacy connection');
    return db;
  }
};

/**
 * Execute database operation with retry logic (preferred method)
 */
export const executeWithRetry = async <T>(
  operation: (db: ReturnType<typeof drizzle>) => Promise<T>,
  operationName?: string
): Promise<T> => {
  try {
    const connectionManager = getDatabaseConnectionManager();
    return await connectionManager.executeWithRetry(operation, operationName);
  } catch (error) {
    // Fallback to direct execution if connection manager not available
    console.warn('Connection manager not available, executing without retry');
    return await operation(db);
  }
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const connectionManager = getDatabaseConnectionManager();
    return await connectionManager.testConnection();
  } catch (error) {
    // Fallback to legacy connection test
    try {
      await pool.query('SELECT 1');
      console.log('Database connection successful');
      return true;
    } catch (legacyError) {
      console.error('Database connection failed:', legacyError);
      return false;
    }
  }
};