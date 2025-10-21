import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db/connection';
import { auditLogs } from '../db/schema/audit-logs';
import { BaseFilters } from '../types/common.types';

/**
 * Audit action types
 */
export type AuditAction = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view';

/**
 * Audit Log entity interface
 */
export interface AuditLog {
  id: string;
  userId: string | null;
  userName: string;
  action: AuditAction;
  resource: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * Audit Log creation data interface
 */
export interface CreateAuditLogData {
  userId?: string | null;
  userName: string;
  action: AuditAction;
  resource: string;
  resourceId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Audit Log filters interface
 */
export interface AuditLogFilters extends BaseFilters {
  userId?: string;
  action?: AuditAction;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Audit Log service class containing all audit log-related business logic
 */
export class AuditLogService {
  /**
   * Create a new audit log entry
   */
  async create(data: CreateAuditLogData): Promise<AuditLog> {
    const result = await db
      .insert(auditLogs)
      .values({
        userId: data.userId || null,
        userName: data.userName,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId || null,
        details: data.details || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null
      })
      .returning();

    return result[0];
  }

  /**
   * Log a login action
   */
  async logLogin(
    userId: string,
    userName: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.create({
      userId,
      userName,
      action: 'login',
      resource: 'auth',
      details: 'User logged in successfully',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log a logout action
   */
  async logLogout(
    userId: string,
    userName: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.create({
      userId,
      userName,
      action: 'logout',
      resource: 'auth',
      details: 'User logged out',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log a create action
   */
  async logCreate(
    userId: string,
    userName: string,
    resource: string,
    resourceId: string,
    details?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.create({
      userId,
      userName,
      action: 'create',
      resource,
      resourceId,
      details: details || `Created ${resource}`,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log an update action
   */
  async logUpdate(
    userId: string,
    userName: string,
    resource: string,
    resourceId: string,
    details?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.create({
      userId,
      userName,
      action: 'update',
      resource,
      resourceId,
      details: details || `Updated ${resource}`,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log a delete action
   */
  async logDelete(
    userId: string,
    userName: string,
    resource: string,
    resourceId: string,
    details?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.create({
      userId,
      userName,
      action: 'delete',
      resource,
      resourceId,
      details: details || `Deleted ${resource}`,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log a view action
   */
  async logView(
    userId: string,
    userName: string,
    resource: string,
    resourceId?: string,
    details?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.create({
      userId,
      userName,
      action: 'view',
      resource,
      resourceId,
      details: details || `Viewed ${resource}`,
      ipAddress,
      userAgent
    });
  }

  /**
   * Find all audit logs with optional filtering
   */
  async findAll(filters: AuditLogFilters = {}): Promise<AuditLog[]> {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resource,
      resourceId,
      startDate,
      endDate
    } = filters;

    // Build where conditions
    const conditions = [];

    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    if (resource) {
      conditions.push(eq(auditLogs.resource, resource));
    }

    if (resourceId) {
      conditions.push(eq(auditLogs.resourceId, resourceId));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, endDate));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Apply pagination
    const offset = (page - 1) * limit;

    const result = await db
      .select()
      .from(auditLogs)
      .where(whereCondition)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Count total audit logs with filters
   */
  async count(filters: AuditLogFilters = {}): Promise<number> {
    const { userId, action, resource, resourceId, startDate, endDate } = filters;

    const conditions = [];

    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    if (resource) {
      conditions.push(eq(auditLogs.resource, resource));
    }

    if (resourceId) {
      conditions.push(eq(auditLogs.resourceId, resourceId));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, endDate));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(whereCondition);

    return result[0]?.count || 0;
  }

  /**
   * Find audit logs by user ID
   */
  async findByUserId(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.findAll({ userId, limit });
  }

  /**
   * Find audit logs by resource and resource ID
   */
  async findByResource(
    resource: string,
    resourceId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    return this.findAll({ resource, resourceId, limit });
  }

  /**
   * Find recent audit logs
   */
  async findRecent(limit: number = 50): Promise<AuditLog[]> {
    return this.findAll({ limit });
  }

  /**
   * Get audit statistics for a user
   */
  async getUserStatistics(userId: string): Promise<{
    totalActions: number;
    actionsByType: Record<AuditAction, number>;
    lastAction?: AuditLog;
  }> {
    // Get total count
    const total = await this.count({ userId });

    // Get counts by action type
    const actionCounts = await db
      .select({
        action: auditLogs.action,
        count: sql<number>`count(*)::int`
      })
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .groupBy(auditLogs.action);

    const actionsByType: Record<string, number> = {
      login: 0,
      logout: 0,
      create: 0,
      update: 0,
      delete: 0,
      view: 0
    };

    actionCounts.forEach(row => {
      actionsByType[row.action] = row.count;
    });

    // Get last action
    const lastActions = await this.findAll({ userId, limit: 1 });
    const lastAction = lastActions[0];

    return {
      totalActions: total,
      actionsByType: actionsByType as Record<AuditAction, number>,
      lastAction
    };
  }

  /**
   * Delete old audit logs (data retention)
   * @param daysToKeep - Number of days to keep logs
   */
  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db
      .delete(auditLogs)
      .where(lte(auditLogs.createdAt, cutoffDate))
      .returning();

    return result.length;
  }
}

// Export singleton instance
export const auditLogService = new AuditLogService();
