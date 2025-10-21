import { FastifyRequest } from 'fastify';
import { auditLogService, AuditAction } from '../services/audit-logs.service';

/**
 * Extract IP address from Fastify request
 */
export function extractIpAddress(request: FastifyRequest): string | undefined {
  // Try to get from x-forwarded-for header (if behind proxy)
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = typeof forwardedFor === 'string' ? forwardedFor.split(',') : forwardedFor;
    return ips[0].trim();
  }

  // Try to get from x-real-ip header
  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return typeof realIp === 'string' ? realIp : realIp[0];
  }

  // Fallback to request.ip
  return request.ip;
}

/**
 * Extract User Agent from Fastify request
 */
export function extractUserAgent(request: FastifyRequest): string | undefined {
  const userAgent = request.headers['user-agent'];
  return typeof userAgent === 'string' ? userAgent : undefined;
}

/**
 * Audit log helper for easy logging throughout the application
 */
export class AuditHelper {
  /**
   * Log an action with automatic extraction of IP and User Agent
   */
  static async log(
    action: AuditAction,
    resource: string,
    userId: string,
    userName: string,
    request?: FastifyRequest,
    resourceId?: string,
    details?: string
  ): Promise<void> {
    try {
      const ipAddress = request ? extractIpAddress(request) : undefined;
      const userAgent = request ? extractUserAgent(request) : undefined;

      await auditLogService.create({
        userId,
        userName,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent
      });
    } catch (error) {
      // Log errors but don't throw - audit logging should not break the main flow
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Log login action
   */
  static async logLogin(
    userId: string,
    userName: string,
    request?: FastifyRequest
  ): Promise<void> {
    const ipAddress = request ? extractIpAddress(request) : undefined;
    const userAgent = request ? extractUserAgent(request) : undefined;

    try {
      await auditLogService.logLogin(userId, userName, ipAddress, userAgent);
    } catch (error) {
      console.error('Failed to log login:', error);
    }
  }

  /**
   * Log logout action
   */
  static async logLogout(
    userId: string,
    userName: string,
    request?: FastifyRequest
  ): Promise<void> {
    const ipAddress = request ? extractIpAddress(request) : undefined;
    const userAgent = request ? extractUserAgent(request) : undefined;

    try {
      await auditLogService.logLogout(userId, userName, ipAddress, userAgent);
    } catch (error) {
      console.error('Failed to log logout:', error);
    }
  }

  /**
   * Log create action
   */
  static async logCreate(
    resource: string,
    resourceId: string,
    userId: string,
    userName: string,
    request?: FastifyRequest,
    details?: string
  ): Promise<void> {
    const ipAddress = request ? extractIpAddress(request) : undefined;
    const userAgent = request ? extractUserAgent(request) : undefined;

    try {
      await auditLogService.logCreate(
        userId,
        userName,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent
      );
    } catch (error) {
      console.error('Failed to log create:', error);
    }
  }

  /**
   * Log update action
   */
  static async logUpdate(
    resource: string,
    resourceId: string,
    userId: string,
    userName: string,
    request?: FastifyRequest,
    details?: string
  ): Promise<void> {
    const ipAddress = request ? extractIpAddress(request) : undefined;
    const userAgent = request ? extractUserAgent(request) : undefined;

    try {
      await auditLogService.logUpdate(
        userId,
        userName,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent
      );
    } catch (error) {
      console.error('Failed to log update:', error);
    }
  }

  /**
   * Log delete action
   */
  static async logDelete(
    resource: string,
    resourceId: string,
    userId: string,
    userName: string,
    request?: FastifyRequest,
    details?: string
  ): Promise<void> {
    const ipAddress = request ? extractIpAddress(request) : undefined;
    const userAgent = request ? extractUserAgent(request) : undefined;

    try {
      await auditLogService.logDelete(
        userId,
        userName,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent
      );
    } catch (error) {
      console.error('Failed to log delete:', error);
    }
  }

  /**
   * Log view action
   */
  static async logView(
    resource: string,
    userId: string,
    userName: string,
    request?: FastifyRequest,
    resourceId?: string,
    details?: string
  ): Promise<void> {
    const ipAddress = request ? extractIpAddress(request) : undefined;
    const userAgent = request ? extractUserAgent(request) : undefined;

    try {
      await auditLogService.logView(
        userId,
        userName,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent
      );
    } catch (error) {
      console.error('Failed to log view:', error);
    }
  }
}
