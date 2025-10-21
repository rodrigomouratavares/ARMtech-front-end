import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';
import type { User } from '../types/auth.types';

/**
 * Authentication middleware factory
 * Creates a preHandler hook that validates JWT tokens and sets user on request
 */
export function createAuthMiddleware(options: {
  required?: boolean;
  roles?: ('admin' | 'manager' | 'employee')[];
} = {}) {
  const { required = true, roles } = options;

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = request.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

      if (!token) {
        if (required) {
          return reply.status(401).send({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'No authentication token provided'
            },
            timestamp: new Date().toISOString(),
            path: request.url
          });
        }
        return; // Continue without authentication if not required
      }

      // Validate token and get user
      const user = await authService.validateToken(token);
      request.user = user;

      // Check role authorization if specified
      if (roles && roles.length > 0) {
        if (!roles.includes(user.role)) {
          return reply.status(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions'
            },
            timestamp: new Date().toISOString(),
            path: request.url
          });
        }
      }

      request.log.debug('User authenticated successfully', {
        userId: user.id,
        email: user.email,
        role: user.role
      } as any);

    } catch (error) {
      request.log.warn('Authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: request.url
      } as any);

      if (required) {
        return reply.status(401).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired authentication token'
          },
          timestamp: new Date().toISOString(),
          path: request.url
        });
      }
    }
  };
}

/**
 * Standard authentication middleware (required)
 */
export const authenticateUser = createAuthMiddleware({ required: true });

/**
 * Optional authentication middleware
 */
export const optionalAuth = createAuthMiddleware({ required: false });

/**
 * Admin-only authentication middleware
 */
export const authenticateAdmin = createAuthMiddleware({
  required: true,
  roles: ['admin']
});

/**
 * Manager or Admin authentication middleware
 */
export const authenticateManager = createAuthMiddleware({
  required: true,
  roles: ['admin', 'manager']
});

/**
 * Helper function to check if request is authenticated
 */
export function isAuthenticated(request: FastifyRequest): boolean {
  return !!request.user;
}

/**
 * Helper function to get current user from request
 */
export function getCurrentUser(request: FastifyRequest): User | null {
  return request.user || null;
}

/**
 * Helper function to check user role
 */
export function hasRole(request: FastifyRequest, role: 'admin' | 'manager' | 'employee'): boolean {
  return request.user?.role === role;
}

/**
 * Helper function to check if user has any of the specified roles
 */
export function hasAnyRole(request: FastifyRequest, roles: ('admin' | 'manager' | 'employee')[]): boolean {
  return request.user ? roles.includes(request.user.role) : false;
}