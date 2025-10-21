import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
	canAccessRoute,
	getDefaultRouteForUser,
	getRedirectRouteOnAccessDenied,
} from '../utils/routingUtils';

/**
 * Hook for handling navigation with permission-based redirections
 */
export const useNavigationRedirect = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	/**
	 * Navigate to a route with permission checking
	 * If user doesn't have permission, redirect to appropriate fallback
	 */
	const navigateWithPermissionCheck = useCallback(
		(route: string, options?: { replace?: boolean; state?: unknown }) => {
			if (!user) {
				navigate('/login', { replace: true });
				return;
			}

			// Check if user can access the route
			if (canAccessRoute(route, user.userType, user.permissions)) {
				navigate(route, options);
			} else {
				// Redirect to appropriate fallback route
				const fallbackRoute = getRedirectRouteOnAccessDenied(
					route,
					user.userType,
					user.permissions,
				);
				navigate(fallbackRoute, { replace: true });
			}
		},
		[navigate, user],
	);

	/**
	 * Navigate to the default route for the current user
	 */
	const navigateToDefaultRoute = useCallback(() => {
		if (!user) {
			navigate('/login', { replace: true });
			return;
		}

		const defaultRoute = getDefaultRouteForUser(
			user.userType,
			user.permissions,
		);
		navigate(defaultRoute, { replace: true });
	}, [navigate, user]);

	/**
	 * Navigate to access denied page with context
	 */
	const navigateToAccessDenied = useCallback(
		(attemptedRoute?: string, message?: string) => {
			navigate('/access-denied', {
				replace: true,
				state: {
					attemptedRoute,
					message,
					timestamp: new Date().toISOString(),
				},
			});
		},
		[navigate],
	);

	/**
	 * Check if current user can access a route
	 */
	const canUserAccessRoute = useCallback(
		(route: string) => {
			if (!user) return false;
			return canAccessRoute(route, user.userType, user.permissions);
		},
		[user],
	);

	/**
	 * Get the appropriate redirect route for access denied scenarios
	 */
	const getAccessDeniedRedirect = useCallback(
		(attemptedRoute: string) => {
			if (!user) return '/login';
			return getRedirectRouteOnAccessDenied(
				attemptedRoute,
				user.userType,
				user.permissions,
			);
		},
		[user],
	);

	return {
		navigateWithPermissionCheck,
		navigateToDefaultRoute,
		navigateToAccessDenied,
		canUserAccessRoute,
		getAccessDeniedRedirect,
	};
};
