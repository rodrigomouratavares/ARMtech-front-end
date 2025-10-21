import { useCallback, useRef, useState } from 'react';
import { useError } from '../context/ErrorContext';

export interface OptimisticUpdateOptions<T> {
	onSuccess?: (data: T) => void;
	onError?: (error: unknown) => void;
	revertOnError?: boolean;
}

export interface OptimisticState<T> {
	data: T;
	isOptimistic: boolean;
	isPending: boolean;
	error: Error | null;
}

export const useOptimisticUpdate = <T>(
	initialData: T,
	options: OptimisticUpdateOptions<T> = {},
) => {
	const { handleError } = useError();
	const [state, setState] = useState<OptimisticState<T>>({
		data: initialData,
		isOptimistic: false,
		isPending: false,
		error: null,
	});

	const previousDataRef = useRef<T>(initialData);

	const updateOptimistically = useCallback(
		async <R>(
			optimisticData: T,
			operation: () => Promise<R>,
			finalData?: T,
		): Promise<R | undefined> => {
			// Store current data for potential rollback
			previousDataRef.current = state.data;

			// Apply optimistic update
			setState((prev) => ({
				...prev,
				data: optimisticData,
				isOptimistic: true,
				isPending: true,
				error: null,
			}));

			try {
				const result = await operation();

				// Success - apply final data or keep optimistic data
				setState((prev) => ({
					...prev,
					data: finalData || optimisticData,
					isOptimistic: false,
					isPending: false,
					error: null,
				}));

				options.onSuccess?.(finalData || optimisticData);
				return result;
			} catch (error) {
				// Error - revert to previous data if configured
				if (options.revertOnError !== false) {
					setState((prev) => ({
						...prev,
						data: previousDataRef.current,
						isOptimistic: false,
						isPending: false,
						error: error instanceof Error ? error : new Error(String(error)),
					}));
				} else {
					setState((prev) => ({
						...prev,
						isOptimistic: false,
						isPending: false,
						error: error instanceof Error ? error : new Error(String(error)),
					}));
				}

				if (options.onError) {
					options.onError(error);
				} else {
					handleError(error, { operation: 'optimistic_update' });
				}

				return undefined;
			}
		},
		[state.data, options, handleError],
	);

	const updateData = useCallback((newData: T) => {
		setState((prev) => ({
			...prev,
			data: newData,
			isOptimistic: false,
			isPending: false,
			error: null,
		}));
	}, []);

	const clearError = useCallback(() => {
		setState((prev) => ({
			...prev,
			error: null,
		}));
	}, []);

	const reset = useCallback(() => {
		setState({
			data: initialData,
			isOptimistic: false,
			isPending: false,
			error: null,
		});
	}, [initialData]);

	return {
		...state,
		updateOptimistically,
		updateData,
		clearError,
		reset,
	};
};

// Specialized hook for list operations
export const useOptimisticList = <T extends { id: string | number }>(
	initialList: T[],
	options: OptimisticUpdateOptions<T[]> = {},
) => {
	const optimistic = useOptimisticUpdate(initialList, options);

	const addItem = useCallback(
		async (item: T, operation: () => Promise<T>) => {
			const optimisticList = [...optimistic.data, item];

			return optimistic.updateOptimistically(optimisticList, async () => {
				const result = await operation();
				return result;
			}, [
				...optimistic.data.filter((existing) => existing.id !== item.id),
				item,
			]);
		},
		[optimistic],
	);

	const updateItem = useCallback(
		async (
			id: string | number,
			updates: Partial<T>,
			operation: () => Promise<T>,
		) => {
			const optimisticList = optimistic.data.map((item) =>
				item.id === id ? { ...item, ...updates } : item,
			);

			return optimistic.updateOptimistically(
				optimisticList,
				operation,
				optimisticList,
			);
		},
		[optimistic],
	);

	const removeItem = useCallback(
		async (id: string | number, operation: () => Promise<void>) => {
			const optimisticList = optimistic.data.filter((item) => item.id !== id);

			return optimistic.updateOptimistically(
				optimisticList,
				operation,
				optimisticList,
			);
		},
		[optimistic],
	);

	return {
		...optimistic,
		addItem,
		updateItem,
		removeItem,
	};
};

// Hook for form optimistic updates
export const useOptimisticForm = <T>(
	initialData: T,
	options: OptimisticUpdateOptions<T> = {},
) => {
	const optimistic = useOptimisticUpdate(initialData, options);

	const submitForm = useCallback(
		async (formData: T, operation: () => Promise<T>) => {
			return optimistic.updateOptimistically(formData, operation, formData);
		},
		[optimistic],
	);

	return {
		...optimistic,
		submitForm,
	};
};
