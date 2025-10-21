import { FastifyInstance } from 'fastify';
import { db } from '../db/connection';
import { users } from '../db/schema/users';
import { authenticateAdmin, authenticateManager } from '../middlewares/auth.middleware';
import { eq } from 'drizzle-orm';

/**
 * User management routes
 */
export async function userRoutes(fastify: FastifyInstance): Promise<void> {
    // Get all users (admin/manager only)
    fastify.get('/', {
        preHandler: authenticateManager
    }, async (request, reply) => {
        try {
            const allUsers = await db
                .select({
                    id: users.id,
                    email: users.email,
                    name: users.name,
                    role: users.role,
                    permissions: users.permissions,
                    createdAt: users.createdAt,
                    updatedAt: users.updatedAt
                })
                .from(users);

            return reply.status(200).send({
                success: true,
                data: allUsers,
                message: 'Users retrieved successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            return reply.status(500).send({
                success: false,
                error: {
                    code: 'FETCH_USERS_FAILED',
                    message: error.message || 'Failed to fetch users',
                },
                timestamp: new Date().toISOString(),
                path: request.url
            });
        }
    });

    // Get user by ID (admin/manager only)
    fastify.get('/:id', {
        preHandler: authenticateManager
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };

            const userResult = await db
                .select({
                    id: users.id,
                    email: users.email,
                    name: users.name,
                    role: users.role,
                    permissions: users.permissions,
                    createdAt: users.createdAt,
                    updatedAt: users.updatedAt
                })
                .from(users)
                .where(eq(users.id, id))
                .limit(1);

            if (userResult.length === 0) {
                return reply.status(404).send({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found',
                    },
                    timestamp: new Date().toISOString(),
                    path: request.url
                });
            }

            return reply.status(200).send({
                success: true,
                data: userResult[0],
                message: 'User retrieved successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            return reply.status(500).send({
                success: false,
                error: {
                    code: 'FETCH_USER_FAILED',
                    message: error.message || 'Failed to fetch user',
                },
                timestamp: new Date().toISOString(),
                path: request.url
            });
        }
    });

    // Update user (admin only)
    fastify.put('/:id', {
        preHandler: authenticateAdmin
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { name, email, role, permissions } = request.body as any;

            // Check if user exists
            const existingUser = await db
                .select()
                .from(users)
                .where(eq(users.id, id))
                .limit(1);

            if (existingUser.length === 0) {
                return reply.status(404).send({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found',
                    },
                    timestamp: new Date().toISOString(),
                    path: request.url
                });
            }

            // Check if email is already in use by another user
            if (email && email !== existingUser[0].email) {
                const emailExists = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email.toLowerCase()))
                    .limit(1);

                if (emailExists.length > 0) {
                    return reply.status(409).send({
                        success: false,
                        error: {
                            code: 'EMAIL_ALREADY_EXISTS',
                            message: 'Email already in use by another user',
                        },
                        timestamp: new Date().toISOString(),
                        path: request.url
                    });
                }
            }

            // Update user
            const updateData: any = {
                updatedAt: new Date()
            };

            if (name) updateData.name = name;
            if (email) updateData.email = email.toLowerCase();
            if (role) updateData.role = role;
            if (permissions) updateData.permissions = permissions;

            const updatedUserResult = await db
                .update(users)
                .set(updateData)
                .where(eq(users.id, id))
                .returning({
                    id: users.id,
                    email: users.email,
                    name: users.name,
                    role: users.role,
                    permissions: users.permissions,
                    createdAt: users.createdAt,
                    updatedAt: users.updatedAt
                });

            return reply.status(200).send({
                success: true,
                data: updatedUserResult[0],
                message: 'User updated successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            return reply.status(500).send({
                success: false,
                error: {
                    code: 'UPDATE_USER_FAILED',
                    message: error.message || 'Failed to update user',
                },
                timestamp: new Date().toISOString(),
                path: request.url
            });
        }
    });

    // Delete user (admin only)
    fastify.delete('/:id', {
        preHandler: authenticateAdmin
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };

            // Check if user exists
            const existingUser = await db
                .select()
                .from(users)
                .where(eq(users.id, id))
                .limit(1);

            if (existingUser.length === 0) {
                return reply.status(404).send({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found',
                    },
                    timestamp: new Date().toISOString(),
                    path: request.url
                });
            }

            // Prevent admin from deleting themselves
            if (request.user?.id === id) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'CANNOT_DELETE_SELF',
                        message: 'You cannot delete your own account',
                    },
                    timestamp: new Date().toISOString(),
                    path: request.url
                });
            }

            // Delete user
            await db.delete(users).where(eq(users.id, id));

            return reply.status(200).send({
                success: true,
                message: 'User deleted successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            return reply.status(500).send({
                success: false,
                error: {
                    code: 'DELETE_USER_FAILED',
                    message: error.message || 'Failed to delete user',
                },
                timestamp: new Date().toISOString(),
                path: request.url
            });
        }
    });

    fastify.log.info('User routes registered successfully');
}