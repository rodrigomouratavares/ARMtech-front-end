import { useCallback, useEffect, useState } from 'react';
import { presaleService } from '../services/presaleService';
import type {
	CreatePreSaleRequest,
	PreSale,
	PreSaleQueryParams,
	UpdatePreSaleRequest,
} from '../types/api';

interface UsePresalesOptions {
	autoFetch?: boolean;
	initialParams?: PreSaleQueryParams;
}

interface UsePresalesReturn {
	presales: PreSale[];
	loading: boolean;
	error: string | null;
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	} | null;

	// Actions
	fetchPresales: (params?: PreSaleQueryParams) => Promise<void>;
	createPresale: (data: CreatePreSaleRequest) => Promise<PreSale | null>;
	updatePresale: (
		id: string,
		data: UpdatePreSaleRequest,
	) => Promise<PreSale | null>;
	deletePresale: (id: string) => Promise<boolean>;
	updatePresaleStatus: (
		id: string,
		status: PreSale['status'],
	) => Promise<PreSale | null>;
	convertToSale: (id: string) => Promise<PreSale | null>;
	getPresaleById: (id: string) => Promise<PreSale | null>;

	// Utility actions
	refreshPresales: () => Promise<void>;
	clearError: () => void;
}

export const usePresales = (
	options: UsePresalesOptions = {},
): UsePresalesReturn => {
	const { autoFetch = true, initialParams } = options;

	const [presales, setPresales] = useState<PreSale[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] =
		useState<UsePresalesReturn['pagination']>(null);
	const [currentParams, setCurrentParams] = useState<
		PreSaleQueryParams | undefined
	>(initialParams);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const fetchPresales = useCallback(
		async (params?: PreSaleQueryParams) => {
			try {
				setLoading(true);
				setError(null);

				const queryParams = params || currentParams;
				setCurrentParams(queryParams);

				const response = await presaleService.getAll(queryParams);

				if (response.success) {
					// Ensure data is always an array
					const presalesData = Array.isArray(response.data)
						? response.data
						: [];
					console.log('usePresales - API Response:', {
						success: response.success,
						dataLength: presalesData.length,
						firstItem: presalesData[0],
						pagination: response.pagination,
					});
					setPresales(presalesData);
					setPagination(response.pagination);
				} else {
					console.log('usePresales - API Error:', response);
					throw new Error(response.message || 'Failed to fetch pre-sales');
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to fetch pre-sales';
				setError(errorMessage);
				console.error('Error fetching pre-sales:', err);
				// Ensure presales is always an array even on error
				setPresales([]);
				setPagination(null);
			} finally {
				setLoading(false);
			}
		},
		[], // Remove currentParams dependency to prevent loop
	);

	const createPresale = useCallback(
		async (data: CreatePreSaleRequest): Promise<PreSale | null> => {
			try {
				setLoading(true);
				setError(null);

				const response = await presaleService.create(data);

				if (response.success) {
					// Add the new pre-sale to the beginning of the list
					setPresales((prev) => [response.data, ...prev]);
					return response.data;
				} else {
					throw new Error(response.message || 'Failed to create pre-sale');
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to create pre-sale';
				setError(errorMessage);
				console.error('Error creating pre-sale:', err);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const updatePresale = useCallback(
		async (id: string, data: UpdatePreSaleRequest): Promise<PreSale | null> => {
			try {
				setLoading(true);
				setError(null);

				const response = await presaleService.update(id, data);

				if (response.success) {
					// Update the pre-sale in the list
					setPresales((prev) =>
						prev.map((presale) =>
							presale.id === id ? response.data : presale,
						),
					);
					return response.data;
				} else {
					throw new Error(response.message || 'Failed to update pre-sale');
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to update pre-sale';
				setError(errorMessage);
				console.error('Error updating pre-sale:', err);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const deletePresale = useCallback(async (id: string): Promise<boolean> => {
		try {
			setLoading(true);
			setError(null);

			const response = await presaleService.delete(id);

			if (response.success) {
				// Remove the pre-sale from the list
				setPresales((prev) => prev.filter((presale) => presale.id !== id));
				return true;
			} else {
				throw new Error(response.message || 'Failed to delete pre-sale');
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to delete pre-sale';
			setError(errorMessage);
			console.error('Error deleting pre-sale:', err);
			return false;
		} finally {
			setLoading(false);
		}
	}, []);

	const updatePresaleStatus = useCallback(
		async (id: string, status: PreSale['status']): Promise<PreSale | null> => {
			try {
				setLoading(true);
				setError(null);

				const response = await presaleService.updateStatus(id, status);

				if (response.success) {
					// Update the pre-sale status in the list
					setPresales((prev) =>
						prev.map((presale) =>
							presale.id === id ? response.data : presale,
						),
					);
					return response.data;
				} else {
					throw new Error(
						response.message || 'Failed to update pre-sale status',
					);
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: 'Failed to update pre-sale status';
				setError(errorMessage);
				console.error('Error updating pre-sale status:', err);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const convertToSale = useCallback(
		async (id: string): Promise<PreSale | null> => {
			try {
				setLoading(true);
				setError(null);

				const response = await presaleService.convertToSale(id);

				if (response.success) {
					// Update the pre-sale in the list (should now have 'converted' status)
					setPresales((prev) =>
						prev.map((presale) =>
							presale.id === id ? response.data : presale,
						),
					);
					return response.data;
				} else {
					throw new Error(
						response.message || 'Failed to convert pre-sale to sale',
					);
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: 'Failed to convert pre-sale to sale';
				setError(errorMessage);
				console.error('Error converting pre-sale to sale:', err);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const getPresaleById = useCallback(
		async (id: string): Promise<PreSale | null> => {
			try {
				setLoading(true);
				setError(null);

				const response = await presaleService.getById(id);

				if (response.success) {
					return response.data;
				} else {
					throw new Error(response.message || 'Failed to fetch pre-sale');
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to fetch pre-sale';
				setError(errorMessage);
				console.error('Error fetching pre-sale by ID:', err);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const refreshPresales = useCallback(async () => {
		await fetchPresales();
	}, [fetchPresales]);

	// Auto-fetch on mount if enabled
	useEffect(() => {
		if (autoFetch) {
			fetchPresales(initialParams);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [autoFetch]);

	return {
		presales,
		loading,
		error,
		pagination,
		fetchPresales,
		createPresale,
		updatePresale,
		deletePresale,
		updatePresaleStatus,
		convertToSale,
		getPresaleById,
		refreshPresales,
		clearError,
	};
};
