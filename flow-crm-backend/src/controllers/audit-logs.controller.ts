import { FastifyRequest, FastifyReply } from 'fastify';
import { auditLogService } from '../services/audit-logs.service';
import { AuditLogQueryParams, UserIdParams } from '../schemas/audit-logs.schemas';

/**
 * Audit Logs Controller
 * Handles all HTTP requests related to audit logs
 */
export class AuditLogsController {
  /**
   * Get all audit logs with pagination and filters
   * GET /api/audit-logs
   */
  async getAuditLogs(
    request: FastifyRequest<{ Querystring: AuditLogQueryParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const filters = request.query;

      // Get audit logs
      const logs = await auditLogService.findAll(filters);

      // Get total count for pagination
      const total = await auditLogService.count(filters);

      // Calculate pagination metadata
      const { page = 1, limit = 50 } = filters;
      const totalPages = Math.ceil(total / limit);

      reply.status(200).send({
        success: true,
        data: logs,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        message: 'Audit logs retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve audit logs';

      reply.status(500).send({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: errorMessage
        },
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  }

  /**
   * Get audit logs for a specific user
   * GET /api/users/:userId/audit-logs
   */
  async getUserAuditLogs(
    request: FastifyRequest<{ 
      Params: UserIdParams;
      Querystring: Omit<AuditLogQueryParams, 'userId'>;
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const filters = { ...request.query, userId };

      // Get audit logs
      const logs = await auditLogService.findAll(filters);

      // Get total count for pagination
      const total = await auditLogService.count(filters);

      // Calculate pagination metadata
      const { page = 1, limit = 50 } = filters;
      const totalPages = Math.ceil(total / limit);

      reply.status(200).send({
        success: true,
        data: logs,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        message: 'User audit logs retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve user audit logs';

      reply.status(500).send({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: errorMessage
        },
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  }

  /**
   * Get audit statistics for a user
   * GET /api/users/:userId/audit-stats
   */
  async getUserAuditStats(
    request: FastifyRequest<{ Params: UserIdParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { userId } = request.params;

      const stats = await auditLogService.getUserStatistics(userId);

      reply.status(200).send({
        success: true,
        data: stats,
        message: 'User audit statistics retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve user audit statistics';

      reply.status(500).send({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: errorMessage
        },
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  }

  /**
   * Get recent audit logs
   * GET /api/audit-logs/recent
   */
  async getRecentAuditLogs(
    request: FastifyRequest<{ Querystring: { limit?: number } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const limit = request.query.limit || 50;

      const logs = await auditLogService.findRecent(limit);

      reply.status(200).send({
        success: true,
        data: logs,
        message: 'Recent audit logs retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve recent audit logs';

      reply.status(500).send({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: errorMessage
        },
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  }
}

// Export singleton instance
export const auditLogsController = new AuditLogsController();
