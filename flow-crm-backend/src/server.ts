import 'dotenv/config';
import { buildApp } from './app';
import { env } from './config/environment';
import { checkDatabaseConnection } from './db/connection';

/**
 * Application entry point with proper error handling and graceful shutdown
 */
const start = async (): Promise<void> => {
  let app: Awaited<ReturnType<typeof buildApp>> | null = null;

  try {
    // Build the Fastify application
    app = buildApp();

    // Perform database health check before starting server
    app.log.info('Checking database connection...');
    const isDatabaseConnected = await checkDatabaseConnection();

    if (!isDatabaseConnected) {
      throw new Error('Database connection failed - cannot start server');
    }

    app.log.info('Database connection verified successfully');

    // Start the server
    const address = await app.listen({
      port: env.PORT,
      host: '0.0.0.0', // Allow access from network
    });

    app.log.info(`🚀 Server running at ${address}`);
    app.log.info(`📊 Health check available at ${address}/health`);
    app.log.info(`🔧 Environment: ${env.NODE_ENV}`);

  } catch (error) {
    if (app) {
      app.log.error(error, 'Error starting server');
    } else {
      console.error('Error starting server:', error);
    }
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  try {
    // Give the server some time to finish processing current requests
    const shutdownTimeout = setTimeout(() => {
      console.log('⚠️  Shutdown timeout reached, forcing exit');
      process.exit(1);
    }, 10000); // 10 seconds timeout

    // Close the server gracefully
    const app = buildApp();
    await app.close();

    clearTimeout(shutdownTimeout);
    console.log('✅ Server closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle process signals for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
start();