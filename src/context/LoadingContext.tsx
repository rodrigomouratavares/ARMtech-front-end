import React, {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from 'react';

export interface LoadingState {
	[key: string]: boolean;
}

export interface LoadingContextType {
	loadingStates: LoadingState;
	isLoading: (key?: string) => boolean;
	setLoading: (key: string, loading: boolean) => void;
	startLoading: (key: string) => void;
	stopLoading: (key: string) => void;
	clearAllLoading: () => void;
	withLoading: <T extends any[], R>(
		key: string,
		operation: (...args: T) => Promise<R>,
	) => (...args: T) => Promise<R>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
	children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({
	children,
}) => {
	const [loadingStates, setLoadingStates] = useState<LoadingState>({});

	const isLoading = useCallback(
		(key?: string) => {
			if (key) {
				return loadingStates[key] || false;
			}
			// If no key provided, check if any operation is loading
			return Object.values(loadingStates).some((loading) => loading);
		},
		[loadingStates],
	);

	const setLoading = useCallback((key: string, loading: boolean) => {
		setLoadingStates((prev) => ({
			...prev,
			[key]: loading,
		}));
	}, []);

	const startLoading = useCallback(
		(key: string) => {
			setLoading(key, true);
		},
		[setLoading],
	);

	const stopLoading = useCallback(
		(key: string) => {
			setLoading(key, false);
		},
		[setLoading],
	);

	const clearAllLoading = useCallback(() => {
		setLoadingStates({});
	}, []);

	const withLoading = useCallback(
		<T extends any[], R>(
			key: string,
			operation: (...args: T) => Promise<R>,
		) => {
			return async (...args: T): Promise<R> => {
				startLoading(key);
				try {
					const result = await operation(...args);
					return result;
				} finally {
					stopLoading(key);
				}
			};
		},
		[startLoading, stopLoading],
	);

	const contextValue: LoadingContextType = {
		loadingStates,
		isLoading,
		setLoading,
		startLoading,
		stopLoading,
		clearAllLoading,
		withLoading,
	};

	return (
		<LoadingContext.Provider value={contextValue}>
			{children}
		</LoadingContext.Provider>
	);
};

export const useLoading = (): LoadingContextType => {
	const context = useContext(LoadingContext);
	if (!context) {
		throw new Error('useLoading must be used within a LoadingProvider');
	}
	return context;
};

// Convenience hooks for common loading patterns
export const useOperationLoading = (operationKey: string) => {
	const { isLoading, startLoading, stopLoading, withLoading } = useLoading();

	return {
		isLoading: isLoading(operationKey),
		startLoading: () => startLoading(operationKey),
		stopLoading: () => stopLoading(operationKey),
		withLoading: <T extends any[], R>(operation: (...args: T) => Promise<R>) =>
			withLoading(operationKey, operation),
	};
};

export const useFormLoading = () => {
	return useOperationLoading('form-submit');
};

export const useApiLoading = (endpoint: string) => {
	return useOperationLoading(`api-${endpoint}`);
};
