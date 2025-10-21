import type {
	DefaultPermissions,
	ModulePermission,
	PresalePermission,
	User,
	UserPermissions,
	UserType,
} from '../types';

/**
 * Default permissions configuration for each user type
 */
export const DEFAULT_PERMISSIONS: DefaultPermissions = {
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

/**
 * Gets default permissions for a specific user type
 */
export const getDefaultPermissions = (userType: UserType): UserPermissions => {
	return JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS[userType]));
};

/**
 * Validates if a user has a specific permission
 * @param user - The user to check permissions for
 * @param permission - Permission string in format "module.action" or just "module"
 * @returns boolean indicating if user has the permission
 */
export const hasPermission = (user: User, permission: string): boolean => {
	if (!user || !user.permissions) {
		return false;
	}

	// Admin users have all permissions
	if (user.userType === 'admin') {
		return true;
	}

	// Parse permission string
	const parts = permission.split('.');
	const module = parts[0];
	const action = parts[1];

	// Handle module-level permissions
	if (module === 'modules' && action) {
		return user.permissions.modules[action as ModulePermission] || false;
	}

	// Handle presales permissions
	if (module === 'presales' && action) {
		return user.permissions.presales[action as PresalePermission] || false;
	}

	// Handle direct module access (backward compatibility)
	if (!action) {
		// Check if it's a direct module permission
		if (module in user.permissions.modules) {
			return user.permissions.modules[module as ModulePermission] || false;
		}

		// Check presales module access
		if (module === 'presales') {
			return (
				user.permissions.presales.canCreate ||
				user.permissions.presales.canViewOwn
			);
		}
	}

	return false;
};

/**
 * Checks if a user can access a specific module
 * @param user - The user to check access for
 * @param module - Module name to check access for
 * @returns boolean indicating if user can access the module
 */
export const canAccessModule = (user: User, module: string): boolean => {
	if (!user || !user.permissions) {
		return false;
	}

	// Admin users can access all modules
	if (user.userType === 'admin') {
		return true;
	}

	// Handle presales module specially
	if (module === 'presales') {
		return (
			user.permissions.presales.canCreate ||
			user.permissions.presales.canViewOwn
		);
	}

	// Check standard module permissions
	if (module in user.permissions.modules) {
		return user.permissions.modules[module as ModulePermission] || false;
	}

	return false;
};

/**
 * Checks if a user is an administrator
 */
export const isAdmin = (user: User): boolean => {
	return user?.userType === 'admin';
};

/**
 * Checks if a user is an employee
 */
export const isEmployee = (user: User): boolean => {
	return user?.userType === 'employee';
};

/**
 * Gets all available permissions for a user type
 */
export const getAvailablePermissions = (userType: UserType): string[] => {
	const permissions: string[] = [];

	if (userType === 'admin') {
		// Admins have access to all permissions
		permissions.push(
			'modules.products',
			'modules.customers',
			'modules.reports',
			'modules.paymentMethods',
			'modules.userManagement',
			'presales.canCreate',
			'presales.canViewOwn',
			'presales.canViewAll',
		);
	} else {
		// Employees have limited permissions
		permissions.push(
			'modules.products',
			'modules.customers',
			'presales.canCreate',
			'presales.canViewOwn',
		);
	}

	return permissions;
};

/**
 * Validates permission structure
 */
export const validatePermissions = (permissions: UserPermissions): boolean => {
	try {
		// Check if all required properties exist
		if (!permissions.modules || !permissions.presales) {
			return false;
		}

		// Check modules structure
		const requiredModules = [
			'products',
			'customers',
			'reports',
			'paymentMethods',
			'userManagement',
		];
		for (const module of requiredModules) {
			if (
				typeof permissions.modules[module as ModulePermission] !== 'boolean'
			) {
				return false;
			}
		}

		// Check presales structure
		const requiredPresalesPerms = ['canCreate', 'canViewOwn', 'canViewAll'];
		for (const perm of requiredPresalesPerms) {
			if (
				typeof permissions.presales[perm as PresalePermission] !== 'boolean'
			) {
				return false;
			}
		}

		return true;
	} catch {
		return false;
	}
};

/**
 * Merges permissions with defaults, ensuring all required fields exist
 */
export const mergeWithDefaults = (
	userType: UserType,
	permissions?: Partial<UserPermissions>,
): UserPermissions => {
	const defaults = getDefaultPermissions(userType);

	if (!permissions) {
		return defaults;
	}

	return {
		modules: {
			...defaults.modules,
			...permissions.modules,
		},
		presales: {
			...defaults.presales,
			...permissions.presales,
		},
	};
};

/**
 * Filters permissions based on user type constraints
 * Ensures employees can't have admin-only permissions
 */
export const filterPermissionsByUserType = (
	userType: UserType,
	permissions: UserPermissions,
): UserPermissions => {
	if (userType === 'admin') {
		return permissions;
	}

	// For employees, remove admin-only permissions
	return {
		modules: {
			...permissions.modules,
			paymentMethods: false,
			userManagement: false,
		},
		presales: {
			...permissions.presales,
			canViewAll: false,
		},
	};
};

/**
 * Gets permission display names for UI
 */
export const getPermissionDisplayName = (permission: string): string => {
	const displayNames: Record<string, string> = {
		'modules.products': 'Produtos',
		'modules.customers': 'Clientes',
		'modules.reports': 'Relatórios',
		'modules.paymentMethods': 'Formas de Pagamento',
		'modules.userManagement': 'Gestão de Usuários',
		'presales.canCreate': 'Criar Pré-vendas',
		'presales.canViewOwn': 'Ver Próprias Pré-vendas',
		'presales.canViewAll': 'Ver Todas as Pré-vendas',
	};

	return displayNames[permission] || permission;
};

/**
 * Groups permissions by category for UI display
 */
export const getGroupedPermissions = (
	userType: UserType,
): Record<string, string[]> => {
	const availablePermissions = getAvailablePermissions(userType);

	const grouped: Record<string, string[]> = {
		Módulos: [],
		'Pré-vendas': [],
	};

	for (const permission of availablePermissions) {
		if (permission.startsWith('modules.')) {
			grouped['Módulos'].push(permission);
		} else if (permission.startsWith('presales.')) {
			grouped['Pré-vendas'].push(permission);
		}
	}

	return grouped;
};

/**
 * Checks if user can perform a specific action on presales
 */
export const canPerformPresaleAction = (
	user: User,
	action: 'create' | 'viewOwn' | 'viewAll',
	presaleUserId?: string,
): boolean => {
	if (!user || !user.permissions) {
		return false;
	}

	// Admin users can perform all actions
	if (user.userType === 'admin') {
		return true;
	}

	switch (action) {
		case 'create':
			return user.permissions.presales.canCreate;

		case 'viewOwn':
			return user.permissions.presales.canViewOwn;

		case 'viewAll':
			// Can view all OR can view own and it's their own presale
			return (
				user.permissions.presales.canViewAll ||
				(user.permissions.presales.canViewOwn && presaleUserId === user.id)
			);

		default:
			return false;
	}
};

/**
 * Gets navigation items based on user permissions
 */
export const getNavigationItems = (user: User): string[] => {
	if (!user) {
		return [];
	}

	const items: string[] = ['dashboard']; // Dashboard is always available

	// Add items based on permissions
	if (canAccessModule(user, 'presales')) {
		items.push('presales');
	}

	if (hasPermission(user, 'modules.products')) {
		items.push('products');
	}

	if (hasPermission(user, 'modules.customers')) {
		items.push('customers');
	}

	if (hasPermission(user, 'modules.reports')) {
		items.push('reports');
	}

	if (hasPermission(user, 'modules.paymentMethods')) {
		items.push('paymentMethods');
	}

	if (hasPermission(user, 'modules.userManagement')) {
		items.push('users');
	}

	return items;
};
