/**
 * Error handling utilities for permission and user management errors
 */

import type { UserManagementError } from '../types';

export interface PermissionError extends Error {
	code: 'PERMISSION_DENIED' | 'SESSION_EXPIRED' | 'UNAUTHORIZED_ACCESS';
	requiredPermission?: string;
	attemptedRoute?: string;
	userType?: string;
	timestamp: Date;
}

export interface ErrorHandlingOptions {
	showToast?: boolean;
	redirectTo?: string;
	logError?: boolean;
}

/**
 * Creates a permission error with context
 */
export const createPermissionError = (
	message: string,
	code: PermissionError['code'],
	context?: {
		requiredPermission?: string;
		attemptedRoute?: string;
		userType?: string;
	},
): PermissionError => {
	const error = new Error(message) as PermissionError;
	error.code = code;
	error.requiredPermission = context?.requiredPermission;
	error.attemptedRoute = context?.attemptedRoute;
	error.userType = context?.userType;
	error.timestamp = new Date();
	return error;
};

/**
 * Checks if an error is a permission error
 */
export const isPermissionError = (error: unknown): error is PermissionError => {
	return (
		error instanceof Error &&
		'code' in error &&
		['PERMISSION_DENIED', 'SESSION_EXPIRED', 'UNAUTHORIZED_ACCESS'].includes(
			(error as PermissionError).code,
		)
	);
};

/**
 * Checks if an error is a user management error
 */
export const isUserManagementError = (
	error: unknown,
): error is UserManagementError => {
	return (
		error instanceof Error &&
		'code' in error &&
		[
			'PERMISSION_DENIED',
			'USER_NOT_FOUND',
			'EMAIL_EXISTS',
			'INVALID_DATA',
		].includes((error as UserManagementError).code)
	);
};

/**
 * Gets user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
	if (isPermissionError(error)) {
		switch (error.code) {
			case 'PERMISSION_DENIED':
				return error.requiredPermission
					? `Você não tem permissão para: ${error.requiredPermission}`
					: 'Você não tem permissão para acessar este recurso';
			case 'SESSION_EXPIRED':
				return 'Sua sessão expirou. Faça login novamente';
			case 'UNAUTHORIZED_ACCESS':
				return 'Acesso não autorizado. Verifique suas credenciais';
			default:
				return error.message || 'Erro de permissão';
		}
	}

	if (isUserManagementError(error)) {
		switch (error.code) {
			case 'EMAIL_EXISTS':
				return 'Este email já está em uso';
			case 'USER_NOT_FOUND':
				return 'Usuário não encontrado';
			case 'INVALID_DATA':
				return error.message || 'Dados inválidos';
			case 'PERMISSION_DENIED':
				return 'Você não tem permissão para esta operação';
			default:
				return error.message || 'Erro na gestão de usuários';
		}
	}

	if (error instanceof Error) {
		return error.message;
	}

	return 'Erro desconhecido';
};

/**
 * Gets appropriate redirect path based on error type and user context
 */
export const getErrorRedirectPath = (
	error: unknown,
	userType?: 'admin' | 'employee',
): string => {
	if (isPermissionError(error)) {
		switch (error.code) {
			case 'SESSION_EXPIRED':
			case 'UNAUTHORIZED_ACCESS':
				return '/login';
			case 'PERMISSION_DENIED':
				return '/dashboard';
			default:
				return '/dashboard';
		}
	}

	// Default redirect based on user type
	if (userType === 'admin') {
		return '/dashboard';
	}

	return '/dashboard';
};

/**
 * Logs error with context for debugging
 */
export const logError = (
	error: unknown,
	context?: {
		userId?: string;
		userType?: string;
		route?: string;
		action?: string;
	},
): void => {
	const errorInfo = {
		message: getErrorMessage(error),
		timestamp: new Date().toISOString(),
		context,
		stack: error instanceof Error ? error.stack : undefined,
	};

	console.error('Application Error:', errorInfo);

	// In a real application, you might want to send this to a logging service
	// logToService(errorInfo);
};

/**
 * Handles permission errors with appropriate actions
 */
export const handlePermissionError = (
	error: unknown,
	options: ErrorHandlingOptions = {},
): {
	message: string;
	redirectTo: string;
	shouldRedirect: boolean;
} => {
	const message = getErrorMessage(error);
	const redirectTo = options.redirectTo || getErrorRedirectPath(error);
	const shouldRedirect =
		isPermissionError(error) &&
		['SESSION_EXPIRED', 'UNAUTHORIZED_ACCESS'].includes(error.code);

	if (options.logError !== false) {
		logError(error);
	}

	return {
		message,
		redirectTo,
		shouldRedirect,
	};
};

/**
 * Creates navigation state for error pages
 */
export const createErrorNavigationState = (
	error: unknown,
	attemptedRoute?: string,
) => {
	return {
		message: getErrorMessage(error),
		attemptedRoute,
		timestamp: new Date().toISOString(),
		errorCode: isPermissionError(error) ? error.code : 'UNKNOWN',
	};
};

/**
 * Validates user permissions and throws appropriate errors
 */
export const validatePermission = (
	hasPermission: boolean,
	requiredPermission: string,
	context?: {
		route?: string;
		userType?: string;
	},
): void => {
	if (!hasPermission) {
		throw createPermissionError(
			`Acesso negado: permissão '${requiredPermission}' necessária`,
			'PERMISSION_DENIED',
			{
				requiredPermission,
				attemptedRoute: context?.route,
				userType: context?.userType,
			},
		);
	}
};

/**
 * Validates user session and throws appropriate errors
 */
export const validateSession = (
	isAuthenticated: boolean,
	sessionValid: boolean = true,
): void => {
	if (!isAuthenticated) {
		throw createPermissionError(
			'Usuário não autenticado',
			'UNAUTHORIZED_ACCESS',
		);
	}

	if (!sessionValid) {
		throw createPermissionError('Sessão expirada', 'SESSION_EXPIRED');
	}
};
