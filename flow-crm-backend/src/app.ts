import Fastify from 'fastify';
import { env } from './config/environment';
import corsPlugin from './plugins/cors.plugin';
import authPlugin from './plugins/auth.plugin';
import databasePlugin from './plugins/database.plugin';
import errorHandlerPlugin from './plugins/error-handler.plugin';
import validationPlugin from './plugins/validation.plugin';
import { registerRoutes } from './routes/index';

export const buildApp = () => {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
    disableRequestLogging: env.NODE_ENV === 'production',
  });

  // Register plugins in order of dependency
  
  // 1. CORS plugin (should be registered early)
  app.register(corsPlugin);

  // 2. Database connection plugin
  app.register(databasePlugin);

  // 3. Error handling plugin
  app.register(errorHandlerPlugin);

  // 4. Validation plugin
  app.register(validationPlugin);

  // 5. Authentication plugin (depends on database)
  app.register(authPlugin);

  // 6. Register all application routes
  app.register(registerRoutes);

  // Add health check endpoint
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    };
  });

  // Add request logging for development
  if (env.NODE_ENV === 'development') {
    app.addHook('onRequest', async (request) => {
      app.log.info({
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      }, 'Incoming request');
    });
  }

  // Add response time logging
  app.addHook('onResponse', async (request, reply) => {
    const responseTime = reply.elapsedTime;
    app.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: responseTime ? `${responseTime.toFixed(2)}ms` : 'unknown',
    }, 'Request completed');
  });

  return app;
};