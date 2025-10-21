import type { UserPermissions, UserType } from '../types';

/**
 * Utility functions for handling routing and redirections based on user permissions
 */

/**
 * Gets the default route for a user based on their permissions
 * @param userType - The type of user (admin or employee)
 * @param permissions - The user's permissions
 * @returns The default route path for the user
 */
export const getDefaultRouteForUser = (
	userType: UserType,
	permissions: UserPermissions,
): string => {
	// Admins always go to dashboard
	if (userType === 'admin') {
		return '/dashboard';
	}

	// For employees, find the first accessible module
	if (permissions.presales.canCreate) {
		return '/presales';
	}

	if (permissions.modules.products) {
		return '/products';
	}

	if (permissions.modules.customers) {
		return '/customers';
	}

	// Fallback to dashboard even for employees
	return '/dashboard';
};

/**
 * Checks if a user can access a specific route
 * @param route - The route path to check
 * @param userType - The type of user
 * @param permissions - The user's permissions
 * @returns Whether the user can access the route
 */
export const canAccessRoute = (
	route: string,
	userType: UserType,
	permissions: UserPermissions,
): boolean => {
	// Admins can access everything except login
	if (userType === 'admin' && route !== '/login') {
		return true;
	}

	// Check specific routes for employees
	switch (route) {
		case '/':
		case '/dashboard':
			return true; // Everyone can access dashboard

		case '/presales':
			return permissions.presales.canCreate;

		case '/products':
			return permissions.modules.products;

		case '/customers':
			return permissions.modules.customers;

		case '/payment-methods':
			return permissions.modules.paymentMethods;

		case '/users':
			return permissions.modules.userManagement;

		case '/inventory':
		case '/settings':
			return userType === 'admin'; // Admin only for now

		case '/login':
		case '/access-denied':
			return true; // Everyone can access these

		default:
			return false;
	}
};

/**
 * Gets a list of accessible routes for a user
 * @param userType - The type of user
 * @param permissions - The user's permissions
 * @returns Array of accessible route paths
 */
export const getAccessibleRoutes = (
	userType: UserType,
	permissions: UserPermissions,
): string[] => {
	const routes = ['/dashboard'];

	if (permissions.presales.canCreate) {
		routes.push('/presales');
	}

	if (permissions.modules.products) {
		routes.push('/products');
	}

	if (permissions.modules.customers) {
		routes.push('/customers');
	}

	if (permissions.modules.paymentMethods) {
		routes.push('/payment-methods');
	}

	if (permissions.modules.userManagement) {
		routes.push('/users');
	}

	if (userType === 'admin') {
		routes.push('/inventory', '/settings');
	}

	return routes;
};

/**
 * Gets the appropriate redirect route when access is denied
 * @param attemptedRoute - The route the user tried to access
 * @param userType - The type of user
 * @param permissions - The user's permissions
 * @returns The route to redirect to
 */
export const getRedirectRouteOnAccessDenied = (
	attemptedRoute: string,
	userType: UserType,
	permissions: UserPermissions,
): string => {
	// If trying to access admin-only routes, redirect to default user route
	const adminOnlyRoutes = [
		'/users',
		'/payment-methods',
		'/inventory',
		'/settings',
	];

	if (adminOnlyRoutes.includes(attemptedRoute) && userType !== 'admin') {
		return getDefaultRouteForUser(userType, permissions);
	}

	// For other permission-based routes, redirect to dashboard
	return '/dashboard';
};

/**
 * Route metadata for permission checking
 */
export const ROUTE_PERMISSIONS = {
	'/dashboard': { public: true },
	'/presales': { permission: 'presales.canCreate' },
	'/products': { permission: 'modules.products' },
	'/customers': { permission: 'modules.customers' },
	'/payment-methods': { permission: 'modules.paymentMethods', adminOnly: true },
	'/users': { permission: 'modules.userManagement', adminOnly: true },
	'/inventory': { adminOnly: true },
	'/settings': { adminOnly: true },
	'/login': { public: true },
	'/access-denied': { public: true },
} as const;

/**
 * Gets route metadata for a given path
 * @param path - The route path
 * @returns Route metadata or null if not found
 */
export const getRouteMetadata = (path: string) => {
	return ROUTE_PERMISSIONS[path as keyof typeof ROUTE_PERMISSIONS] || null;
};
