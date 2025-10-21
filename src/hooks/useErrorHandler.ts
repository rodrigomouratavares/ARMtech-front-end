import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toastService from '../services/ToastService';
import {
	createErrorNavigationState,
	getErrorMessage,
	handlePermissionError,
	isPermissionError,
	isUserManagementError,
} from '../utils/errorHandling';

export interface UseErrorHandlerOptions {
	showToast?: boolean;
	redirectOnPermissionError?: boolean;
	logErrors?: boolean;
}

/**
 * Hook for handling errors consistently across the application
 */
export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
	const navigate = useNavigate();
	const { user, logout } = useAuth();
	const {
		showToast = true,
		redirectOnPermissionError = true,
		logErrors = true,
	} = options;

	/**
	 * Handles any error with appropriate actions
	 */
	const handleError = useCallback(
		(error: unknown, context?: { action?: string; route?: string }) => {
			const errorMessage = getErrorMessage(error);

			// Log error if enabled
			if (logErrors) {
				console.error('Error handled by useErrorHandler:', {
					error,
					context,
					user: user ? { id: user.id, type: user.userType } : null,
					timestamp: new Date().toISOString(),
				});
			}

			// Handle permission errors
			if (isPermissionError(error)) {
				const errorResponse = handlePermissionError(error, {
					logError: logErrors,
				});

				// Show toast notification
				if (showToast) {
					toastService.error(errorResponse.message);
				}

				// Handle session expiration
				if (error.code === 'SESSION_EXPIRED') {
					logout();
					navigate('/login', {
						state: { message: 'Sua sessão expirou. Faça login novamente.' },
					});
					return;
				}

				// Handle unauthorized access
				if (error.code === 'UNAUTHORIZED_ACCESS') {
					logout();
					navigate('/login', {
						state: { message: 'Acesso não autorizado. Faça login novamente.' },
					});
					return;
				}

				// Handle permission denied
				if (error.code === 'PERMISSION_DENIED' && redirectOnPermissionError) {
					const navigationState = createErrorNavigationState(
						error,
						context?.route || window.location.pathname,
					);
					navigate('/access-denied', { state: navigationState });
					return;
				}
			}

			// Handle user management errors
			if (isUserManagementError(error)) {
				if (showToast) {
					toastService.error(errorMessage);
				}
				return;
			}

			// Handle generic errors
			if (showToast) {
				toastService.error(errorMessage);
			}
		},
		[navigate, user, logout, showToast, redirectOnPermissionError, logErrors],
	);

	/**
	 * Handles async operations with error handling
	 */
	const handleAsyncOperation = useCallback(
		async <T>(
			operation: () => Promise<T>,
			context?: { action?: string; route?: string },
		): Promise<T | null> => {
			try {
				return await operation();
			} catch (error) {
				handleError(error, context);
				return null;
			}
		},
		[handleError],
	);

	/**
	 * Creates an error handler for specific contexts
	 */
	const createContextualHandler = useCallback(
		(context: { action: string; route?: string }) => {
			return (error: unknown) => handleError(error, context);
		},
		[handleError],
	);

	/**
	 * Handles form submission errors
	 */
	const handleFormError = useCallback(
		(error: unknown, formName?: string) => {
			handleError(error, {
				action: `form_submission_${formName || 'unknown'}`,
				route: window.location.pathname,
			});
		},
		[handleError],
	);

	/**
	 * Handles API call errors
	 */
	const handleApiError = useCallback(
		(error: unknown, endpoint?: string) => {
			handleError(error, {
				action: `api_call_${endpoint || 'unknown'}`,
				route: window.location.pathname,
			});
		},
		[handleError],
	);

	return {
		handleError,
		handleAsyncOperation,
		createContextualHandler,
		handleFormError,
		handleApiError,
	};
};

export default useErrorHandler;
