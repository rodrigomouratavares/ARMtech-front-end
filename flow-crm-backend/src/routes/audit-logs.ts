import { FastifyInstance } from 'fastify';
import { auditLogsController } from '../controllers/audit-logs.controller';

/**
 * Audit Logs routes
 * Handles all routes for audit logs (read-only, admin access only)
 */
export async function auditLogsRoutes(fastify: FastifyInstance): Promise<void> {
  // Authentication middleware
  const authenticate = async (request: any, reply: any) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided'
        },
        timestamp: new Date().toISOString()
      });
    }
    // TODO: Validate JWT and check for admin role
  };

  /**
   * GET /api/audit-logs
   * List all audit logs with pagination and filters (admin only)
   */
  fastify.get('/', { 
    preHandler: authenticate
  }, async (request, reply) => {
    return auditLogsController.getAuditLogs(request as any, reply);
  });

  /**
   * GET /api/audit-logs/recent
   * Get recent audit logs (admin only)
   */
  fastify.get('/recent', {
    preHandler: authenticate
  }, async (request, reply) => {
    return auditLogsController.getRecentAuditLogs(request as any, reply);
  });

  fastify.log.info('Audit logs routes registered successfully');
}
