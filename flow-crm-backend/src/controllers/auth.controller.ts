import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';
import { LoginRequest, RegisterRequest } from '../schemas/auth.schemas';
import '../types/fastify';

/**
 * Authentication controller
 */
export class AuthController {
  /**
   * Handle user login
   * POST /api/auth/login
   */
  async login(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { email, password } = request.body as LoginRequest;

      const authResponse = await authService.login({ email, password });

      reply.status(200).send({
        success: true,
        data: authResponse,
        message: 'Login successful',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';

      reply.status(401).send({
        error: {
          code: 'LOGIN_FAILED',
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        return reply.status(401).send({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
          },
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }

      reply.status(200).send({
        success: true,
        data: request.user,
        message: 'Profile retrieved successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get profile';

      reply.status(500).send({
        error: {
          code: 'PROFILE_FETCH_FAILED',
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }

  /**
   * Register a new user (admin only)
   * POST /api/auth/register
   */
  async register(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Check if user is admin (this should be handled by middleware, but double-check)
      if (!request.user || (request.user as any).role !== 'admin') {
        return reply.status(403).send({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only administrators can register new users',
          },
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }

      const { email, password, name, role } = request.body as RegisterRequest;

      const newUser = await authService.register({
        email,
        password,
        name,
        role,
      });

      reply.status(201).send({
        success: true,
        data: newUser,
        message: 'User registered successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';

      // Handle specific error cases
      if (errorMessage.includes('already exists')) {
        return reply.status(409).send({
          error: {
            code: 'USER_ALREADY_EXISTS',
            message: errorMessage,
          },
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }

      reply.status(400).send({
        error: {
          code: 'REGISTRATION_FAILED',
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }

  /**
   * Logout user (client-side token removal)
   * POST /api/auth/logout
   */
  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // Since we're using stateless JWT tokens, logout is handled client-side
    // by removing the token from storage. We just return a success response.
    reply.status(200).send({
      success: true,
      message: 'Logout successful',
    });
  }
}

// Export singleton instance
export const authController = new AuthController();