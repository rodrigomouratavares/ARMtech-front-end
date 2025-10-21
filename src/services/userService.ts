import type {
	AuditLog,
	AuditLogFilters,
	CreateUserRequest,
	UpdateUserRequest,
	User,
	UserManagementService,
	UserPermissions,
} from '../types';
import { httpClient } from './httpClient';

/**
 * Real user management service that connects to the backend API
 */
export class UserService implements UserManagementService {
	/**
	 * Gets all users from the backend
	 */
	async getAllUsers(): Promise<User[]> {
		try {
			const response = await httpClient.get<{ success: boolean; data: any[] }>(
				'/users',
			);

			// Check if response has the expected structure
			if (!response.success || !Array.isArray(response.data)) {
				throw new Error('Invalid response format from server');
			}

			// Transform backend user format to frontend format
			return response.data.map((backendUser: any): User => {
				const userType = backendUser.role === 'admin' ? 'admin' : 'employee';

				// Use permissions from database if available, otherwise use defaults
				let permissions: UserPermissions;
				if (backendUser.permissions) {
					permissions = backendUser.permissions as UserPermissions;
				} else {
					// Fallback to default permissions based on role
					permissions =
						userType === 'admin'
							? {
									modules: {
										products: true,
										customers: true,
										reports: true,
										paymentMethods: true,
										userManagement: true,
									},
									presales: {
										canCreate: true,
										canViewOwn: true,
										canViewAll: true,
									},
								}
							: {
									modules: {
										products: true,
										customers: true,
										reports: false,
										paymentMethods: false,
										userManagement: false,
									},
									presales: {
										canCreate: true,
										canViewOwn: true,
										canViewAll: false,
									},
								};
				}

				return {
					id: backendUser.id,
					name: backendUser.name,
					email: backendUser.email,
					password: '', // Don't expose password
					userType: userType as 'admin' | 'employee',
					permissions,
					isActive: true, // Backend doesn't have isActive field yet
					createdAt: new Date(backendUser.createdAt),
					updatedAt: new Date(backendUser.updatedAt),
					lastLoginAt: backendUser.lastLoginAt
						? new Date(backendUser.lastLoginAt)
						: undefined,
				};
			});
		} catch (error) {
			console.error('Failed to fetch users:', error);
			throw new Error('Falha ao carregar usuários');
		}
	}

	/**
	 * Creates a new user
	 */
	async createUser(userData: CreateUserRequest): Promise<User> {
		try {
			// Transform frontend format to backend format
			const backendData = {
				name: userData.name,
				email: userData.email,
				password: userData.password,
				role: userData.userType === 'admin' ? 'admin' : 'employee',
				permissions: userData.permissions,
			};

			const response = await httpClient.post<{ success: boolean; data: any }>(
				'/auth/register',
				backendData,
			);

			// Check if response has the expected structure
			if (!response.success || !response.data) {
				throw new Error('Invalid response format from server');
			}

			const responseUserData = response.data;

			// Transform backend response to frontend format
			const userType = responseUserData.role === 'admin' ? 'admin' : 'employee';

			// Use permissions from database if available, otherwise use defaults
			let permissions: UserPermissions;
			if (responseUserData.permissions) {
				permissions = responseUserData.permissions as UserPermissions;
			} else {
				// Fallback to default permissions based on role
				permissions =
					userType === 'admin'
						? {
								modules: {
									products: true,
									customers: true,
									reports: true,
									paymentMethods: true,
									userManagement: true,
								},
								presales: {
									canCreate: true,
									canViewOwn: true,
									canViewAll: true,
								},
							}
						: {
								modules: {
									products: true,
									customers: true,
									reports: false,
									paymentMethods: false,
									userManagement: false,
								},
								presales: {
									canCreate: true,
									canViewOwn: true,
									canViewAll: false,
								},
							};
			}

			return {
				id: responseUserData.id,
				name: responseUserData.name,
				email: responseUserData.email,
				password: userData.password, // Keep for compatibility
				userType: userType as 'admin' | 'employee',
				permissions,
				isActive: true,
				createdAt: new Date(responseUserData.createdAt),
				updatedAt: new Date(responseUserData.updatedAt),
			};
		} catch (error: any) {
			console.error('Failed to create user:', error);

			// Handle specific backend errors
			if (error.response?.data?.error?.code === 'USER_ALREADY_EXISTS') {
				const userError = new Error('Email já está em uso') as any;
				userError.code = 'EMAIL_EXISTS';
				throw userError;
			}

			throw new Error(
				error.response?.data?.error?.message || 'Falha ao criar usuário',
			);
		}
	}

	/**
	 * Updates an existing user
	 */
	async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
		try {
			// Transform frontend format to backend format
			const backendData: any = {};

			if (userData.name !== undefined) {
				backendData.name = userData.name;
			}
			if (userData.email !== undefined) {
				backendData.email = userData.email;
			}
			if (userData.userType !== undefined) {
				backendData.role = userData.userType === 'admin' ? 'admin' : 'employee';
			}
			if (userData.permissions !== undefined) {
				backendData.permissions = userData.permissions;
			}

			const response = await httpClient.put<{ success: boolean; data: any }>(
				`/users/${userId}`,
				backendData,
			);

			// Check if response has the expected structure
			if (!response.success || !response.data) {
				throw new Error('Invalid response format from server');
			}

			const responseUserData = response.data;
			const userType = responseUserData.role === 'admin' ? 'admin' : 'employee';

			// Use permissions from database if available, otherwise use defaults
			let permissions: UserPermissions;
			if (responseUserData.permissions) {
				permissions = responseUserData.permissions as UserPermissions;
			} else {
				// Fallback to default permissions based on role
				permissions =
					userType === 'admin'
						? {
								modules: {
									products: true,
									customers: true,
									reports: true,
									paymentMethods: true,
									userManagement: true,
								},
								presales: {
									canCreate: true,
									canViewOwn: true,
									canViewAll: true,
								},
							}
						: {
								modules: {
									products: true,
									customers: true,
									reports: false,
									paymentMethods: false,
									userManagement: false,
								},
								presales: {
									canCreate: true,
									canViewOwn: true,
									canViewAll: false,
								},
							};
			}

			// Transform backend response to frontend format
			return {
				id: responseUserData.id,
				name: responseUserData.name,
				email: responseUserData.email,
				password: '', // Don't return password
				userType: userType as 'admin' | 'employee',
				permissions,
				isActive: userData.isActive !== undefined ? userData.isActive : true,
				createdAt: new Date(responseUserData.createdAt),
				updatedAt: new Date(responseUserData.updatedAt),
			};
		} catch (error: any) {
			console.error('Failed to update user:', error);

			// Handle specific backend errors
			if (error.response?.data?.error?.code === 'USER_NOT_FOUND') {
				const userError = new Error('Usuário não encontrado') as any;
				userError.code = 'USER_NOT_FOUND';
				throw userError;
			}

			if (error.response?.data?.error?.code === 'EMAIL_ALREADY_EXISTS') {
				const userError = new Error('Email já está em uso') as any;
				userError.code = 'EMAIL_EXISTS';
				throw userError;
			}

			throw new Error(
				error.response?.data?.error?.message || 'Falha ao atualizar usuário',
			);
		}
	}

	/**
	 * Deletes a user
	 */
	async deleteUser(userId: string): Promise<void> {
		try {
			const response = await httpClient.delete<{ success: boolean }>(
				`/users/${userId}`,
			);

			if (!response.success) {
				throw new Error('Falha ao excluir usuário');
			}
		} catch (error: any) {
			console.error('Failed to delete user:', error);

			if (error.response?.data?.error?.code === 'USER_NOT_FOUND') {
				const userError = new Error('Usuário não encontrado') as any;
				userError.code = 'USER_NOT_FOUND';
				throw userError;
			}

			if (error.response?.data?.error?.code === 'CANNOT_DELETE_SELF') {
				const userError = new Error(
					'Não é possível excluir sua própria conta',
				) as any;
				userError.code = 'PERMISSION_DENIED';
				throw userError;
			}

			throw new Error(
				error.response?.data?.error?.message || 'Falha ao excluir usuário',
			);
		}
	}

	/**
	 * Updates user permissions
	 */
	async updateUserPermissions(
		userId: string,
		permissions: UserPermissions,
	): Promise<void> {
		try {
			const response = await httpClient.put<{ success: boolean }>(
				`/users/${userId}`,
				{
					permissions,
				},
			);

			if (!response.success) {
				throw new Error('Falha ao atualizar permissões do usuário');
			}
		} catch (error: any) {
			console.error('Failed to update user permissions:', error);
			throw new Error(
				error.response?.data?.error?.message ||
					'Falha ao atualizar permissões do usuário',
			);
		}
	}

	/**
	 * Gets audit logs with optional filters
	 */
	async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]> {
		try {
			// This would connect to the audit logs API when available
			const response = await httpClient.get<any[]>('/audit-logs', {
				params: filters,
			});

			return response.map((log: any) => ({
				...log,
				createdAt: new Date(log.createdAt),
				updatedAt: new Date(log.updatedAt),
			}));
		} catch (error) {
			console.error('Failed to fetch audit logs:', error);
			return []; // Return empty array if audit logs are not available
		}
	}
}

// Export singleton instance
export const userService = new UserService();

/**
 * Gets default permissions for a user type (for compatibility with existing code)
 */
export const getDefaultPermissions = (
	userType: 'admin' | 'employee',
): UserPermissions => {
	return userType === 'admin'
		? {
				modules: {
					products: true,
					customers: true,
					reports: true,
					paymentMethods: true,
					userManagement: true,
				},
				presales: {
					canCreate: true,
					canViewOwn: true,
					canViewAll: true,
				},
			}
		: {
				modules: {
					products: true,
					customers: true,
					reports: false,
					paymentMethods: false,
					userManagement: false,
				},
				presales: {
					canCreate: true,
					canViewOwn: true,
					canViewAll: false,
				},
			};
};

export default userService;
