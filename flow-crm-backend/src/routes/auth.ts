import { FastifyInstance } from 'fastify';
import { authService } from '../services/auth.service';
import { authenticateUser, authenticateAdmin } from '../middlewares/auth.middleware';

/**
 * Authentication routes
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Login route
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = request.body as any;

      const authResponse = await authService.login({ email, password });

      return reply.status(200).send({
        success: true,
        data: {
          user: authResponse.user,
          token: authResponse.token,
        },
        message: 'Login successful',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: error.message || 'Invalid credentials',
        },
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  });

  // Register route (admin only)
  fastify.post('/register', {
    preHandler: authenticateAdmin
  }, async (request, reply) => {
    try {
      const { name, email, password, role, permissions } = request.body as any;

      const user = await authService.register({ name, email, password, role, permissions });

      return reply.status(201).send({
        success: true,
        data: user,
        message: 'User registered successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      const statusCode = errorMessage.includes('already exists') ? 409 : 400;

      return reply.status(statusCode).send({
        success: false,
        error: {
          code: errorMessage.includes('already exists') ? 'USER_ALREADY_EXISTS' : 'REGISTRATION_FAILED',
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  });

  // Get current user profile - /me endpoint (expected by frontend)
  fastify.get('/me', {
    preHandler: authenticateUser
  }, async (request, reply) => {
    return reply.status(200).send({
      success: true,
      data: request.user,
      message: 'Profile retrieved successfully',
      timestamp: new Date().toISOString()
    });
  });

  // Legacy profile endpoint (for backwards compatibility)
  fastify.get('/profile', {
    preHandler: authenticateUser
  }, async (request, reply) => {
    return reply.status(200).send({
      success: true,
      data: request.user,
      message: 'Profile retrieved successfully',
      timestamp: new Date().toISOString()
    });
  });

  // Logout route
  fastify.post('/logout', async (request, reply) => {
    return reply.status(200).send({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });
  });

  fastify.log.info('Auth routes registered with improved middleware');
}
