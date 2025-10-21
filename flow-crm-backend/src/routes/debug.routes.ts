import { FastifyInstance } from 'fastify';
import { authenticateUser } from '../middlewares/auth.middleware';

/**
 * Debug routes - ONLY for development
 * These routes should be removed in production
 */
export async function debugRoutes(fastify: FastifyInstance) {
    // Only enable in development
    if (process.env.NODE_ENV !== 'development') {
        return;
    }

    // Apply authentication middleware
    fastify.addHook('preHandler', authenticateUser);

    // GET /api/debug/db - Test database connection
    fastify.get('/db', async (request, reply) => {
        try {
            const { simpleReportsService } = await import('../services/reports.service.simple');

            const dbTest = await simpleReportsService.testDatabase();

            return reply.send({
                success: true,
                data: dbTest
            });
        } catch (error) {
            fastify.log.error('Database test error');
            return reply.status(500).send({
                success: false,
                message: 'Database connection error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // GET /api/debug/reports - Test reports with simple service
    fastify.get('/reports', async (request, reply) => {
        try {
            const { simpleReportsService } = await import('../services/reports.service.simple');

            const reportData = await simpleReportsService.getPaymentMethodsReport();
            const summary = await simpleReportsService.getReportSummary();

            return reply.send({
                success: true,
                data: {
                    reportData,
                    summary,
                    message: 'Simple reports service working'
                }
            });
        } catch (error) {
            fastify.log.error('Simple reports test error');
            return reply.status(500).send({
                success: false,
                message: 'Simple reports error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // GET /api/debug/user - Get current user info
    fastify.get('/user', async (request, reply) => {
        try {
            const user = request.user;

            if (!user) {
                return reply.status(401).send({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            const isAdmin = user.role === 'admin';
            const permissions = user.permissions || {};
            const hasReportsPermission = isAdmin || permissions.modules?.reports === true;

            return reply.send({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    permissions: user.permissions,
                    isAdmin,
                    hasReportsPermission,
                    debugInfo: {
                        permissionsObject: permissions,
                        reportsPermissionValue: permissions.modules?.reports,
                        calculatedAccess: hasReportsPermission
                    }
                }
            });
        } catch (error) {
            fastify.log.error('Debug route error');
            return reply.status(500).send({
                success: false,
                message: 'Internal server error'
            });
        }
    });
}