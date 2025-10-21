import { AxiosError } from 'axios';
import React, {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from 'react';
import toastService, { TOAST_MESSAGES } from '../services/ToastService';
import {
	getErrorMessage,
	isPermissionError,
	logError,
} from '../utils/errorHandling';

export interface ApiError {
	code: string;
	message: string;
	details?: any;
	field?: string;
}

export interface ErrorState {
	hasError: boolean;
	error: Error | null;
	isRetrying: boolean;
	retryCount: number;
}

export interface ErrorContextType {
	// Error state
	errorState: ErrorState;

	// Error handling methods
	handleError: (error: unknown, context?: ErrorContext) => void;
	handleApiError: (error: AxiosError, context?: ErrorContext) => void;
	clearError: () => void;

	// Toast methods
	showSuccess: (message: string) => void;
	showError: (message: string) => void;
	showWarning: (message: string) => void;
	showInfo: (message: string) => void;

	// Retry methods
	retry: (operation: () => Promise<void>) => Promise<void>;
	canRetry: boolean;
}

export interface ErrorContext {
	operation?: string;
	component?: string;
	userId?: string;
	route?: string;
	showToast?: boolean;
	logError?: boolean;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

interface ErrorProviderProps {
	children: ReactNode;
	onError?: (error: Error, context?: ErrorContext) => void;
	onAuthError?: () => void;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({
	children,
	onError,
	onAuthError,
}) => {
	const [errorState, setErrorState] = useState<ErrorState>({
		hasError: false,
		error: null,
		isRetrying: false,
		retryCount: 0,
	});

	const clearError = useCallback(() => {
		setErrorState({
			hasError: false,
			error: null,
			isRetrying: false,
			retryCount: 0,
		});
	}, []);

	const handleError = useCallback(
		(error: unknown, context?: ErrorContext) => {
			const errorObj =
				error instanceof Error ? error : new Error(String(error));

			// Log error if enabled (default: true)
			if (context?.logError !== false) {
				logError(errorObj, {
					userId: context?.userId,
					route: context?.route || window.location.pathname,
					action: context?.operation,
				});
			}

			// Update error state
			setErrorState((prev) => ({
				...prev,
				hasError: true,
				error: errorObj,
				isRetrying: false,
			}));

			// Handle permission errors
			if (isPermissionError(errorObj)) {
				if (
					(errorObj as any).code === 'SESSION_EXPIRED' ||
					(errorObj as any).code === 'UNAUTHORIZED_ACCESS'
				) {
					onAuthError?.();
					return;
				}
			}

			// Show toast notification if enabled (default: true)
			if (context?.showToast !== false) {
				const message = getErrorMessage(errorObj);
				toastService.error(message);
			}

			// Call custom error handler
			onError?.(errorObj, context);
		},
		[onError, onAuthError],
	);

	const handleApiError = useCallback(
		(error: AxiosError, context?: ErrorContext) => {
			let errorMessage: string = TOAST_MESSAGES.generic.error;
			let apiError: ApiError | null = null;

			// Extract API error details
			if (error.response?.data) {
				const responseData = error.response.data as any;

				if (responseData.error) {
					apiError = responseData.error;
					errorMessage = apiError?.message || errorMessage;
				} else if (responseData.message) {
					errorMessage = responseData.message;
				}
			}

			// Handle specific HTTP status codes
			switch (error.response?.status) {
				case 401:
					onAuthError?.();
					return;

				case 403:
					errorMessage = 'Você não tem permissão para realizar esta operação';
					break;

				case 404:
					errorMessage = 'Recurso não encontrado';
					break;

				case 422:
					if (apiError?.field) {
						errorMessage = `Erro no campo ${apiError.field}: ${apiError.message}`;
					} else {
						errorMessage = apiError?.message || 'Dados inválidos';
					}
					break;

				case 429:
					errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos';
					break;

				case 500:
					errorMessage = 'Erro interno do servidor. Tente novamente mais tarde';
					break;

				default:
					if (!error.response) {
						errorMessage = 'Erro de conexão. Verifique sua internet';
					}
			}

			// Create enhanced error object
			const enhancedError = new Error(errorMessage);
			(enhancedError as any).apiError = apiError;
			(enhancedError as any).status = error.response?.status;
			(enhancedError as any).isNetworkError = !error.response;

			handleError(enhancedError, context);
		},
		[handleError, onAuthError],
	);

	const retry = useCallback(
		async (operation: () => Promise<void>) => {
			if (errorState.retryCount >= MAX_RETRY_COUNT) {
				toastService.error('Número máximo de tentativas excedido');
				return;
			}

			setErrorState((prev) => ({
				...prev,
				isRetrying: true,
				retryCount: prev.retryCount + 1,
			}));

			try {
				// Exponential backoff delay
				const delay = RETRY_DELAY_BASE * 2 ** errorState.retryCount;
				await new Promise((resolve) => setTimeout(resolve, delay));

				await operation();

				// Success - clear error state
				clearError();
				toastService.success('Operação realizada com sucesso');
			} catch (error) {
				handleError(error, {
					operation: 'retry',
					showToast: errorState.retryCount >= MAX_RETRY_COUNT - 1,
				});
			}
		},
		[errorState.retryCount, handleError, clearError],
	);

	const canRetry =
		errorState.retryCount < MAX_RETRY_COUNT && !errorState.isRetrying;

	// Toast convenience methods
	const showSuccess = useCallback((message: string) => {
		toastService.success(message);
	}, []);

	const showError = useCallback((message: string) => {
		toastService.error(message);
	}, []);

	const showWarning = useCallback((message: string) => {
		toastService.warning(message);
	}, []);

	const showInfo = useCallback((message: string) => {
		toastService.info(message);
	}, []);

	const contextValue: ErrorContextType = {
		errorState,
		handleError,
		handleApiError,
		clearError,
		showSuccess,
		showError,
		showWarning,
		showInfo,
		retry,
		canRetry,
	};

	return (
		<ErrorContext.Provider value={contextValue}>
			{children}
		</ErrorContext.Provider>
	);
};

export const useError = (): ErrorContextType => {
	const context = useContext(ErrorContext);
	if (!context) {
		throw new Error('useError must be used within an ErrorProvider');
	}
	return context;
};

// Convenience hook for API operations
export const useApiError = () => {
	const { handleApiError, showSuccess } = useError();

	return {
		handleApiError,
		showSuccess,
		withErrorHandling: <T extends any[], R>(
			operation: (...args: T) => Promise<R>,
			context?: ErrorContext,
		) => {
			return async (...args: T): Promise<R | undefined> => {
				try {
					const result = await operation(...args);
					return result;
				} catch (error) {
					if (error instanceof AxiosError) {
						handleApiError(error, context);
					} else {
						handleApiError(error as AxiosError, context);
					}
					return undefined;
				}
			};
		},
	};
};
