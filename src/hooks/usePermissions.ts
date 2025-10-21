import { useAuth } from '../context/AuthContext';
import {
	canAccessModule,
	canPerformPresaleAction,
	hasPermission,
	isAdmin,
	isEmployee,
} from '../services/permissionsService';
import type { UsePermissions, UserPermissions } from '../types';

/**
 * Custom hook for permission checking and user access control
 * Integrates with AuthContext to provide convenient permission methods
 */
export const usePermissions = (): UsePermissions => {
	const { user } = useAuth();

	// Default empty permissions if no user is authenticated
	const defaultPermissions: UserPermissions = {
		modules: {
			products: false,
			customers: false,
			reports: false,
			paymentMethods: false,
			userManagement: false,
		},
		presales: {
			canCreate: false,
			canViewOwn: false,
			canViewAll: false,
		},
	};

	// Get user permissions or default to empty permissions
	const permissions = user?.permissions || defaultPermissions;

	/**
	 * Check if user has a specific permission
	 * @param permission - Permission string in format "module.action" or just "module"
	 * @returns boolean indicating if user has the permission
	 */
	const hasPermissionCheck = (permission: string): boolean => {
		if (!user) return false;
		return hasPermission(user, permission);
	};

	/**
	 * Check if user can access a specific module
	 * @param module - Module name to check access for
	 * @returns boolean indicating if user can access the module
	 */
	const canAccessModuleCheck = (module: string): boolean => {
		if (!user) return false;
		return canAccessModule(user, module);
	};

	/**
	 * Check if current user is an administrator
	 * @returns boolean indicating if user is admin
	 */
	const isAdminCheck = (): boolean => {
		if (!user) return false;
		return isAdmin(user);
	};

	/**
	 * Check if current user is an employee
	 * @returns boolean indicating if user is employee
	 */
	const isEmployeeCheck = (): boolean => {
		if (!user) return false;
		return isEmployee(user);
	};

	/**
	 * Check if user can perform specific presale actions
	 * @param action - The action to check ('create', 'viewOwn', 'viewAll')
	 * @param presaleUserId - Optional user ID for ownership checks
	 * @returns boolean indicating if user can perform the action
	 */
	const canPerformPresaleActionCheck = (
		action: 'create' | 'viewOwn' | 'viewAll',
		presaleUserId?: string,
	): boolean => {
		if (!user) return false;
		return canPerformPresaleAction(user, action, presaleUserId);
	};

	/**
	 * Check if user can create presales
	 * @returns boolean indicating if user can create presales
	 */
	const canCreatePresales = (): boolean => {
		return canPerformPresaleActionCheck('create');
	};

	/**
	 * Check if user can view their own presales
	 * @returns boolean indicating if user can view own presales
	 */
	const canViewOwnPresales = (): boolean => {
		return canPerformPresaleActionCheck('viewOwn');
	};

	/**
	 * Check if user can view all presales
	 * @returns boolean indicating if user can view all presales
	 */
	const canViewAllPresales = (): boolean => {
		return canPerformPresaleActionCheck('viewAll');
	};

	/**
	 * Check if user can view a specific presale
	 * @param presaleUserId - The user ID who created the presale
	 * @returns boolean indicating if user can view the presale
	 */
	const canViewPresale = (presaleUserId: string): boolean => {
		return canPerformPresaleActionCheck('viewAll', presaleUserId);
	};

	/**
	 * Check if user has access to products module
	 * @returns boolean indicating if user can access products
	 */
	const canAccessProducts = (): boolean => {
		return hasPermissionCheck('modules.products');
	};

	/**
	 * Check if user has access to customers module
	 * @returns boolean indicating if user can access customers
	 */
	const canAccessCustomers = (): boolean => {
		return hasPermissionCheck('modules.customers');
	};

	/**
	 * Check if user has access to reports module
	 * @returns boolean indicating if user can access reports
	 */
	const canAccessReports = (): boolean => {
		return hasPermissionCheck('modules.reports');
	};

	/**
	 * Check if user has access to payment methods module
	 * @returns boolean indicating if user can access payment methods
	 */
	const canAccessPaymentMethods = (): boolean => {
		return hasPermissionCheck('modules.paymentMethods');
	};

	/**
	 * Check if user has access to user management module
	 * @returns boolean indicating if user can access user management
	 */
	const canAccessUserManagement = (): boolean => {
		return hasPermissionCheck('modules.userManagement');
	};

	/**
	 * Get all navigation items the user has access to
	 * @returns array of navigation item names
	 */
	const getAccessibleNavigationItems = (): string[] => {
		const items: string[] = ['dashboard']; // Dashboard is always available

		if (canAccessModuleCheck('presales')) {
			items.push('presales');
		}

		if (canAccessProducts()) {
			items.push('products');
		}

		if (canAccessCustomers()) {
			items.push('customers');
		}

		if (canAccessReports()) {
			items.push('reports');
		}

		if (canAccessPaymentMethods()) {
			items.push('paymentMethods');
		}

		if (canAccessUserManagement()) {
			items.push('users');
		}

		return items;
	};

	return {
		// Core permission methods (required by interface)
		hasPermission: hasPermissionCheck,
		canAccessModule: canAccessModuleCheck,
		isAdmin: isAdminCheck,
		isEmployee: isEmployeeCheck,
		permissions,

		// Convenience methods for common permission checks
		canPerformPresaleAction: canPerformPresaleActionCheck,
		canCreatePresales,
		canViewOwnPresales,
		canViewAllPresales,
		canViewPresale,
		canAccessProducts,
		canAccessCustomers,
		canAccessReports,
		canAccessPaymentMethods,
		canAccessUserManagement,
		getAccessibleNavigationItems,
	};
};

export default usePermissions;
