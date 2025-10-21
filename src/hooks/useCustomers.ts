import { useCallback, useEffect, useState } from 'react';
import { customerService } from '../services/customerService';
import type {
	ApiError,
	CreateCustomerRequest,
	Customer,
	CustomerQueryParams,
	UpdateCustomerRequest,
} from '../types/api';

interface UseCustomersState {
	customers: Customer[];
	loading: boolean;
	error: ApiError | null;
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	} | null;
}

interface UseCustomersActions {
	fetchCustomers: (params?: CustomerQueryParams) => Promise<void>;
	createCustomer: (customerData: CreateCustomerRequest) => Promise<Customer>;
	updateCustomer: (
		id: string,
		customerData: UpdateCustomerRequest,
	) => Promise<Customer>;
	deleteCustomer: (id: string) => Promise<void>;
	searchCustomers: (
		query: string,
		params?: Omit<CustomerQueryParams, 'search'>,
	) => Promise<void>;
	clearError: () => void;
	refetch: () => Promise<void>;
}

interface UseCustomersReturn extends UseCustomersState, UseCustomersActions {}

/**
 * Custom hook for managing customer data
 * Provides CRUD operations and state management for customers
 */
export const useCustomers = (
	initialParams?: CustomerQueryParams,
): UseCustomersReturn => {
	const [state, setState] = useState<UseCustomersState>({
		customers: [],
		loading: false,
		error: null,
		pagination: null,
	});

	const [lastParams, setLastParams] = useState<CustomerQueryParams | undefined>(
		initialParams,
	);

	const setLoading = useCallback((loading: boolean) => {
		setState((prev) => ({ ...prev, loading }));
	}, []);

	const setError = useCallback((error: ApiError | null) => {
		setState((prev) => ({ ...prev, error }));
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, [setError]);

	const fetchCustomers = useCallback(
		async (params?: CustomerQueryParams) => {
			try {
				setLoading(true);
				setError(null);
				setLastParams(params);

				const response = await customerService.getCustomers(params);

				// Ensure all customers have cpf as string
				const sanitizedCustomers = response.data.map((customer) => ({
					...customer,
					cpf: customer.cpf || '',
				}));

				setState((prev) => ({
					...prev,
					customers: sanitizedCustomers,
					pagination: response.pagination,
					loading: false,
					error: null,
				}));
			} catch (error) {
				const apiError = error as ApiError;
				setState((prev) => ({
					...prev,
					loading: false,
					error: apiError,
				}));
			}
		},
		[setLoading, setError],
	);

	const createCustomer = useCallback(
		async (customerData: CreateCustomerRequest): Promise<Customer> => {
			try {
				setLoading(true);
				setError(null);

				const newCustomer = await customerService.createCustomer(customerData);

				// Ensure cpf is a string (fallback to empty string if null/undefined)
				const sanitizedCustomer = {
					...newCustomer,
					cpf: newCustomer.cpf || '',
				};

				// Add the new customer to the current list
				setState((prev) => ({
					...prev,
					customers: [sanitizedCustomer, ...prev.customers],
					loading: false,
				}));

				return newCustomer;
			} catch (error) {
				const apiError = error as ApiError;
				setError(apiError);
				setLoading(false);
				throw apiError;
			}
		},
		[setLoading, setError],
	);

	const updateCustomer = useCallback(
		async (
			id: string,
			customerData: UpdateCustomerRequest,
		): Promise<Customer> => {
			try {
				setLoading(true);
				setError(null);

				const updatedCustomer = await customerService.updateCustomer(
					id,
					customerData,
				);

				// Ensure cpf is a string (fallback to empty string if null/undefined)
				const sanitizedUpdatedCustomer = {
					...updatedCustomer,
					cpf: updatedCustomer.cpf || '',
				};

				// Update the customer in the current list
				setState((prev) => ({
					...prev,
					customers: prev.customers.map((customer) =>
						customer.id === id ? sanitizedUpdatedCustomer : customer,
					),
					loading: false,
				}));

				return updatedCustomer;
			} catch (error) {
				const apiError = error as ApiError;
				setError(apiError);
				setLoading(false);
				throw apiError;
			}
		},
		[setLoading, setError],
	);

	const deleteCustomer = useCallback(
		async (id: string): Promise<void> => {
			try {
				setLoading(true);
				setError(null);

				await customerService.deleteCustomer(id);

				// Remove the customer from the current list
				setState((prev) => ({
					...prev,
					customers: prev.customers.filter((customer) => customer.id !== id),
					loading: false,
				}));

				// Success message is handled by the component
			} catch (error: any) {
				const errorMessage = error.message || 'Erro ao excluir cliente';
				const apiError: ApiError = new Error(errorMessage);
				apiError.status = error.status;
				apiError.code = error.code;
				apiError.details = error.details;
				setError(apiError);
				setLoading(false);
				throw apiError;
			}
		},
		[setLoading, setError],
	);

	const searchCustomers = useCallback(
		async (query: string, params?: Omit<CustomerQueryParams, 'search'>) => {
			const searchParams = {
				...params,
				search: query,
				page: 1, // Reset to first page when searching
			};
			await fetchCustomers(searchParams);
		},
		[fetchCustomers],
	);

	const refetch = useCallback(async () => {
		await fetchCustomers(lastParams);
	}, [fetchCustomers, lastParams]);

	// Initial fetch on mount
	useEffect(() => {
		if (initialParams || !lastParams) {
			fetchCustomers(initialParams);
		}
	}, []); // Only run on mount

	return {
		...state,
		fetchCustomers,
		createCustomer,
		updateCustomer,
		deleteCustomer,
		searchCustomers,
		clearError,
		refetch,
	};
};

export default useCustomers;
