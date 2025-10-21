import { FastifyPluginAsync } from 'fastify';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '../config/environment';
import * as schema from '../db/schema';


interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: Date;
  connectionCount?: number;
  responseTime?: number;
  poolStats?: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
}

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle>;
    dbPool: Pool;
    checkDatabaseHealth(): Promise<HealthStatus>;
    executeWithRetry<T>(operation: (db: ReturnType<typeof drizzle>) => Promise<T>, operationName?: string): Promise<T>;
  }
}

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  try {
    fastify.log.info('Initializing database connection...');

    // Create a simple, reliable database connection
    const pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10, // Maximum number of connections in the pool
      min: 1, // Minimum number of connections to maintain
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection could not be established
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Test initial connection
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      fastify.log.info('Database connection test successful');
    } catch (error) {
      fastify.log.error({ error }, 'Database connection test failed');
      throw new Error(`Failed to establish database connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Create Drizzle database instance
    const db = drizzle(pool, { schema });

    // Simple database health check function
    const checkDatabaseHealth = async (): Promise<HealthStatus> => {
      const startTime = Date.now();

      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();

        const responseTime = Date.now() - startTime;

        return {
          status: 'healthy',
          message: 'Database connection is healthy',
          timestamp: new Date(),
          responseTime,
          poolStats: {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount,
          }
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;

        return {
          status: 'unhealthy',
          message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          responseTime
        };
      }
    };

    // Simple wrapper function for executing operations
    const executeWithRetry = async <T>(
      operation: (db: ReturnType<typeof drizzle>) => Promise<T>,
      operationName?: string
    ): Promise<T> => {
      try {
        return await operation(db);
      } catch (error) {
        fastify.log.error({ error, operationName }, 'Database operation failed');
        throw error;
      }
    };

    // Register database instances with Fastify
    fastify.decorate('db', db);
    fastify.decorate('dbPool', pool);
    fastify.decorate('checkDatabaseHealth', checkDatabaseHealth);
    fastify.decorate('executeWithRetry', executeWithRetry);

    // Register health check endpoint
    fastify.get('/health/database', async (_request, reply) => {
      const healthStatus = await checkDatabaseHealth();

      if (healthStatus.status === 'healthy') {
        return reply.code(200).send(healthStatus);
      } else {
        return reply.code(503).send(healthStatus);
      }
    });

    // Handle graceful shutdown
    fastify.addHook('onClose', async () => {
      fastify.log.info('Shutting down database connection pool...');
      try {
        await pool.end();
        fastify.log.info('Database connection pool shut down gracefully');
      } catch (error) {
        fastify.log.error({ error }, 'Error during database pool shutdown');
      }
    });

    fastify.log.info('Database plugin registered successfully');
  } catch (error) {
    fastify.log.error({ error }, 'Failed to initialize database plugin');
    throw error;
  }
};

export default databasePlugin;