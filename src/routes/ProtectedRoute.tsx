import type React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ProtectedRouteProps } from '../types';
import {
	createErrorNavigationState,
	createPermissionError,
	handlePermissionError,
} from '../utils/errorHandling';

/**
 * Enhanced ProtectedRoute component that checks authentication status and permissions
 * and redirects to login page if user is not authenticated or shows access denied if
 * user doesn't have required permissions.
 *
 * When redirecting to login, it preserves the current location
 * so the user can be redirected back after successful authentication.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	children,
	requiredPermission,
	requiredUserType,
	fallback,
	redirectTo = '/dashboard',
}) => {
	const { isAuthenticated, isLoading, hasPermission, user } = useAuth();
	const location = useLocation();

	// Show loading spinner while checking authentication
	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="flex flex-col items-center space-y-4">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
					<p className="text-gray-600">Verificando autenticação...</p>
				</div>
			</div>
		);
	}

	// Redirect to login if not authenticated, preserving the intended location
	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	// Check user type requirement if specified
	if (requiredUserType && user?.userType !== requiredUserType) {
		// Create permission error with context
		const error = createPermissionError(
			requiredUserType === 'admin'
				? 'Esta página é restrita apenas para administradores.'
				: `Esta página requer acesso de ${requiredUserType}.`,
			'PERMISSION_DENIED',
			{
				requiredPermission: `userType:${requiredUserType}`,
				attemptedRoute: location.pathname,
				userType: user?.userType,
			},
		);

		// Handle the error and get appropriate response
		handlePermissionError(error, { redirectTo });

		// Create navigation state with error context
		const navigationState = createErrorNavigationState(
			error,
			location.pathname,
		);

		return (
			fallback || (
				<Navigate to="/access-denied" state={navigationState} replace />
			)
		);
	}

	// Check specific permission requirement if specified
	if (requiredPermission && !hasPermission(requiredPermission)) {
		// Determine appropriate message based on permission type
		let message = 'Você não tem permissão para acessar esta funcionalidade.';

		if (requiredPermission.includes('modules.')) {
			const module = requiredPermission.split('.')[1];
			const moduleNames: Record<string, string> = {
				products: 'Produtos',
				customers: 'Clientes',
				reports: 'Relatórios',
				paymentMethods: 'Formas de Pagamento',
				userManagement: 'Gestão de Usuários',
			};
			message = `Você não tem permissão para acessar o módulo de ${moduleNames[module] || module}.`;
		} else if (requiredPermission.includes('presales.')) {
			message =
				'Você não tem permissão para acessar as funcionalidades de pré-vendas.';
		}

		// Create permission error with context
		const error = createPermissionError(message, 'PERMISSION_DENIED', {
			requiredPermission,
			attemptedRoute: location.pathname,
			userType: user?.userType,
		});

		// Handle the error and get appropriate response
		handlePermissionError(error, { redirectTo });

		// Create navigation state with error context
		const navigationState = createErrorNavigationState(
			error,
			location.pathname,
		);

		return (
			fallback || (
				<Navigate to="/access-denied" state={navigationState} replace />
			)
		);
	}

	// Render protected content if all checks pass
	return <>{children}</>;
};

export default ProtectedRoute;
