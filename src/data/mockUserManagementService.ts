import avatarPNG from '../assets/avatar.jpg';
import type {
	AuditLog,
	AuditLogFilters,
	CreateUserRequest,
	DefaultPermissions,
	UpdateUserRequest,
	User,
	UserManagementError,
	UserManagementService,
	UserPermissions,
} from '../types';

// Local storage keys
const USERS_STORAGE_KEY = 'flowcrm_users';
const AUDIT_LOGS_STORAGE_KEY = 'flowcrm_audit_logs';

// Default permissions by user type
const DEFAULT_PERMISSIONS: DefaultPermissions = {
	admin: {
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
	},
	employee: {
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
	},
};

// Default users for the system
const DEFAULT_USERS: User[] = [
	{
		id: '1',
		name: 'Administrador',
		email: 'admin@flowcrm.com',
		password: 'admin123', // In real app, this would be hashed
		userType: 'admin',
		permissions: DEFAULT_PERMISSIONS.admin,
		isActive: true,
		avatar: avatarPNG,
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-01T00:00:00Z'),
		lastLoginAt: new Date(),
	},
	{
		id: '2',
		name: 'João Silva',
		email: 'joao@flowcrm.com',
		password: 'funcionario123',
		userType: 'employee',
		permissions: DEFAULT_PERMISSIONS.employee,
		isActive: true,
		createdBy: '1',
		createdAt: new Date('2024-01-15T00:00:00Z'),
		updatedAt: new Date('2024-01-15T00:00:00Z'),
	},
	{
		id: '3',
		name: 'Maria Santos',
		email: 'maria@flowcrm.com',
		password: 'funcionario123',
		userType: 'employee',
		permissions: {
			...DEFAULT_PERMISSIONS.employee,
			modules: {
				...DEFAULT_PERMISSIONS.employee.modules,
				reports: true, // Maria has additional reports permission
			},
		},
		isActive: true,
		createdBy: '1',
		createdAt: new Date('2024-02-01T00:00:00Z'),
		updatedAt: new Date('2024-02-01T00:00:00Z'),
	},
];

/**
 * Simulates a network delay for more realistic testing
 */
const delay = (ms: number = 500): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generates a unique ID for new users
 */
const generateId = (): string => {
	return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

/**
 * Validates email format
 */
const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

/**
 * Validates password strength
 */
const isValidPassword = (password: string): boolean => {
	return password.length >= 6;
};

/**
 * Gets users from localStorage or returns default users
 */
const getStoredUsers = (): User[] => {
	try {
		const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
		if (storedUsers) {
			const users = JSON.parse(storedUsers) as User[];
			// Convert date strings back to Date objects
			return users.map((user) => ({
				...user,
				createdAt: new Date(user.createdAt),
				updatedAt: new Date(user.updatedAt),
				lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined,
			}));
		}
	} catch (error) {
		console.warn('Failed to retrieve stored users:', error);
	}

	// Return default users if no stored users or error
	return DEFAULT_USERS;
};

/**
 * Saves users to localStorage
 */
const saveUsers = (users: User[]): void => {
	try {
		localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
	} catch (error) {
		console.warn('Failed to save users:', error);
	}
};

/**
 * Gets audit logs from localStorage
 */
const getStoredAuditLogs = (): AuditLog[] => {
	try {
		const storedLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
		if (storedLogs) {
			const logs = JSON.parse(storedLogs) as AuditLog[];
			// Convert date strings back to Date objects
			return logs.map((log) => ({
				...log,
				createdAt: new Date(log.createdAt),
				updatedAt: new Date(log.updatedAt),
			}));
		}
	} catch (error) {
		console.warn('Failed to retrieve stored audit logs:', error);
	}
	return [];
};

/**
 * Saves audit logs to localStorage
 */
const saveAuditLogs = (logs: AuditLog[]): void => {
	try {
		localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs));
	} catch (error) {
		console.warn('Failed to save audit logs:', error);
	}
};

/**
 * Adds an audit log entry
 */
const addAuditLog = (
	userId: string,
	userName: string,
	action: AuditLog['action'],
	resource: string,
	resourceId?: string,
	details?: string,
): void => {
	const logs = getStoredAuditLogs();
	const newLog: AuditLog = {
		id: generateId(),
		userId,
		userName,
		action,
		resource,
		resourceId,
		details,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	logs.push(newLog);
	saveAuditLogs(logs);
};

/**
 * Mock user management service
 * Simulates backend user management with localStorage persistence
 */
export const mockUserManagementService: UserManagementService = {
	/**
	 * Gets all users from the system
	 */
	async getAllUsers(): Promise<User[]> {
		await delay();
		return getStoredUsers();
	},

	/**
	 * Creates a new user
	 */
	async createUser(userData: CreateUserRequest): Promise<User> {
		await delay();

		// Validation
		if (!userData.name?.trim()) {
			const error: UserManagementError = new Error(
				'Nome é obrigatório',
			) as UserManagementError;
			error.code = 'INVALID_DATA';
			throw error;
		}

		if (!userData.email?.trim()) {
			const error: UserManagementError = new Error(
				'Email é obrigatório',
			) as UserManagementError;
			error.code = 'INVALID_DATA';
			throw error;
		}

		if (!isValidEmail(userData.email)) {
			const error: UserManagementError = new Error(
				'Email inválido',
			) as UserManagementError;
			error.code = 'INVALID_DATA';
			throw error;
		}

		if (!userData.password?.trim()) {
			const error: UserManagementError = new Error(
				'Senha é obrigatória',
			) as UserManagementError;
			error.code = 'INVALID_DATA';
			throw error;
		}

		if (!isValidPassword(userData.password)) {
			const error: UserManagementError = new Error(
				'Senha deve ter pelo menos 6 caracteres',
			) as UserManagementError;
			error.code = 'INVALID_DATA';
			throw error;
		}

		// Check if email already exists
		const existingUsers = getStoredUsers();
		const emailExists = existingUsers.some(
			(user) => user.email.toLowerCase() === userData.email.toLowerCase(),
		);

		if (emailExists) {
			const error: UserManagementError = new Error(
				'Email já está em uso',
			) as UserManagementError;
			error.code = 'EMAIL_EXISTS';
			throw error;
		}

		// Create new user
		const now = new Date();
		const newUser: User = {
			id: generateId(),
			name: userData.name.trim(),
			email: userData.email.toLowerCase().trim(),
			password: userData.password, // In real app, this would be hashed
			userType: userData.userType,
			permissions: userData.permissions
				? ({ ...userData.permissions } as UserPermissions)
				: DEFAULT_PERMISSIONS[userData.userType],
			isActive: true,
			avatar: userData.avatar,
			createdAt: now,
			updatedAt: now,
		};

		// Save to storage
		const updatedUsers = [...existingUsers, newUser];
		saveUsers(updatedUsers);

		// Add audit log
		addAuditLog(
			'1', // Assuming admin user for now
			'Administrador',
			'create',
			'user',
			newUser.id,
			`Usuário ${newUser.name} criado`,
		);

		return newUser;
	},

	/**
	 * Updates an existing user
	 */
	async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
		await delay();

		const users = getStoredUsers();
		const userIndex = users.findIndex((user) => user.id === userId);

		if (userIndex === -1) {
			const error: UserManagementError = new Error(
				'Usuário não encontrado',
			) as UserManagementError;
			error.code = 'USER_NOT_FOUND';
			throw error;
		}

		const existingUser = users[userIndex];

		// Validation
		if (userData.name !== undefined && !userData.name.trim()) {
			const error: UserManagementError = new Error(
				'Nome é obrigatório',
			) as UserManagementError;
			error.code = 'INVALID_DATA';
			throw error;
		}

		if (userData.email !== undefined) {
			if (!userData.email.trim()) {
				const error: UserManagementError = new Error(
					'Email é obrigatório',
				) as UserManagementError;
				error.code = 'INVALID_DATA';
				throw error;
			}

			if (!isValidEmail(userData.email)) {
				const error: UserManagementError = new Error(
					'Email inválido',
				) as UserManagementError;
				error.code = 'INVALID_DATA';
				throw error;
			}

			// Check if email already exists (excluding current user)
			const emailExists = users.some(
				(user) =>
					user.id !== userId &&
					user.email.toLowerCase() === userData.email!.toLowerCase(),
			);

			if (emailExists) {
				const error: UserManagementError = new Error(
					'Email já está em uso',
				) as UserManagementError;
				error.code = 'EMAIL_EXISTS';
				throw error;
			}
		}

		if (
			userData.password !== undefined &&
			!isValidPassword(userData.password)
		) {
			const error: UserManagementError = new Error(
				'Senha deve ter pelo menos 6 caracteres',
			) as UserManagementError;
			error.code = 'INVALID_DATA';
			throw error;
		}

		// Update user
		const updatedUser: User = {
			...existingUser,
			...(userData.name !== undefined && { name: userData.name.trim() }),
			...(userData.email !== undefined && {
				email: userData.email.toLowerCase().trim(),
			}),
			...(userData.password !== undefined && { password: userData.password }),
			...(userData.userType !== undefined && { userType: userData.userType }),
			...(userData.permissions !== undefined && {
				permissions: userData.permissions,
			}),
			...(userData.isActive !== undefined && { isActive: userData.isActive }),
			...(userData.avatar !== undefined && { avatar: userData.avatar }),
			updatedAt: new Date(),
		};

		// If user type changed, update permissions to default for new type
		if (
			userData.userType !== undefined &&
			userData.userType !== existingUser.userType
		) {
			updatedUser.permissions =
				userData.permissions || DEFAULT_PERMISSIONS[userData.userType];
		}

		users[userIndex] = updatedUser;
		saveUsers(users);

		// Add audit log
		addAuditLog(
			'1', // Assuming admin user for now
			'Administrador',
			'update',
			'user',
			userId,
			`Usuário ${updatedUser.name} atualizado`,
		);

		return updatedUser;
	},

	/**
	 * Deletes a user
	 */
	async deleteUser(userId: string): Promise<void> {
		await delay();

		const users = getStoredUsers();
		const userIndex = users.findIndex((user) => user.id === userId);

		if (userIndex === -1) {
			const error: UserManagementError = new Error(
				'Usuário não encontrado',
			) as UserManagementError;
			error.code = 'USER_NOT_FOUND';
			throw error;
		}

		const userToDelete = users[userIndex];

		// Prevent deleting the main admin user
		if (userToDelete.id === '1') {
			const error: UserManagementError = new Error(
				'Não é possível excluir o usuário administrador principal',
			) as UserManagementError;
			error.code = 'PERMISSION_DENIED';
			throw error;
		}

		// Remove user
		users.splice(userIndex, 1);
		saveUsers(users);

		// Add audit log
		addAuditLog(
			'1', // Assuming admin user for now
			'Administrador',
			'delete',
			'user',
			userId,
			`Usuário ${userToDelete.name} excluído`,
		);
	},

	/**
	 * Updates user permissions
	 */
	async updateUserPermissions(
		userId: string,
		permissions: UserPermissions,
	): Promise<void> {
		await delay();

		const users = getStoredUsers();
		const userIndex = users.findIndex((user) => user.id === userId);

		if (userIndex === -1) {
			const error: UserManagementError = new Error(
				'Usuário não encontrado',
			) as UserManagementError;
			error.code = 'USER_NOT_FOUND';
			throw error;
		}

		const user = users[userIndex];
		user.permissions = permissions;
		user.updatedAt = new Date();

		saveUsers(users);

		// Add audit log
		addAuditLog(
			'1', // Assuming admin user for now
			'Administrador',
			'update',
			'user',
			userId,
			`Permissões do usuário ${user.name} atualizadas`,
		);
	},

	/**
	 * Gets audit logs with optional filters
	 */
	async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]> {
		await delay();

		let logs = getStoredAuditLogs();

		// Apply filters
		if (filters) {
			if (filters.userId) {
				logs = logs.filter((log) => log.userId === filters.userId);
			}
			if (filters.action) {
				logs = logs.filter((log) => log.action === filters.action);
			}
			if (filters.resource) {
				logs = logs.filter((log) => log.resource === filters.resource);
			}
			if (filters.startDate) {
				logs = logs.filter((log) => log.createdAt >= filters.startDate!);
			}
			if (filters.endDate) {
				logs = logs.filter((log) => log.createdAt <= filters.endDate!);
			}
		}

		// Sort by creation date (newest first)
		logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

		// Apply pagination
		if (filters?.offset) {
			logs = logs.slice(filters.offset);
		}
		if (filters?.limit) {
			logs = logs.slice(0, filters.limit);
		}

		return logs;
	},
};

/**
 * Gets default permissions for a user type
 */
export const getDefaultPermissions = (
	userType: 'admin' | 'employee',
): UserPermissions => {
	return { ...DEFAULT_PERMISSIONS[userType] };
};

/**
 * Validates if a user has a specific permission
 */
export const hasPermission = (user: User, permission: string): boolean => {
	const [module, action] = permission.split('.');

	if (module === 'modules') {
		return (
			user.permissions.modules[
				action as keyof typeof user.permissions.modules
			] || false
		);
	}

	if (module === 'presales') {
		return (
			user.permissions.presales[
				action as keyof typeof user.permissions.presales
			] || false
		);
	}

	return false;
};

/**
 * Checks if a user can access a specific module
 */
export const canAccessModule = (user: User, module: string): boolean => {
	if (module === 'presales') {
		return (
			user.permissions.presales.canCreate ||
			user.permissions.presales.canViewOwn
		);
	}

	return (
		user.permissions.modules[module as keyof typeof user.permissions.modules] ||
		false
	);
};

export default mockUserManagementService;
