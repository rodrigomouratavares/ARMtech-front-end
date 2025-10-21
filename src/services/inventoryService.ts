import type { Product } from '../types';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import { httpClient } from './httpClient';

// Error types for inventory operations
export interface InventoryError extends Error {
	code:
		| 'NETWORK_ERROR'
		| 'VALIDATION_ERROR'
		| 'NOT_FOUND'
		| 'INSUFFICIENT_STOCK'
		| 'CONFLICT'
		| 'UNAUTHORIZED'
		| 'SERVER_ERROR'
		| 'UNKNOWN_ERROR';
	status?: number;
	details?: any;
}

// Retry configuration
interface RetryConfig {
	maxRetries: number;
	baseDelay: number;
	maxDelay: number;
	retryCondition?: (error: any) => boolean;
}

// Stock adjustment request interface
export interface StockAdjustmentRequest {
	adjustmentType: 'add' | 'remove';
	quantity: number;
	reason: string;
}

// Stock adjustment response interface
export interface StockAdjustment {
	id: string;
	productId: string;
	productCode: string;
	productName: string;
	adjustmentType: 'add' | 'remove';
	quantity: number;
	previousStock: number;
	newStock: number;
	reason: string;
	userId: string;
	userName: string;
	createdAt: string;
}

// Stock history filters interface
export interface StockHistoryFilters {
	productId?: string;
	productCode?: string;
	adjustmentType?: 'add' | 'remove';
	startDate?: string;
	endDate?: string;
	userId?: string;
	page?: number;
	limit?: number;
}

/**
 * Inventory Service
 * Handles API communication for stock operations including product search,
 * stock adjustments, and history retrieval with comprehensive error handling
 * and response transformation
 */
class InventoryService {
	private readonly baseUrl = '';
	private readonly defaultRetryConfig: RetryConfig = {
		maxRetries: 3,
		baseDelay: 1000,
		maxDelay: 5000,
		retryCondition: (error: any) => {
			// Retry on network errors and 5xx server errors
			return (
				!error.response ||
				(error.response.status >= 500 && error.response.status < 600)
			);
		},
	};

	/**
	 * Create a standardized inventory error
	 */
	private createInventoryError(
		message: string,
		code: InventoryError['code'],
		status?: number,
		details?: any,
	): InventoryError {
		const error = new Error(message) as InventoryError;
		error.code = code;
		error.status = status;
		error.details = details;
		return error;
	}

	/**
	 * Transform API error to user-friendly inventory error
	 */
	private transformApiError(error: any, operation: string): InventoryError {
		console.error(`Inventory service error during ${operation}:`, error);

		// Network errors
		if (!error.response) {
			return this.createInventoryError(
				'Network connection failed. Please check your internet connection and try again.',
				'NETWORK_ERROR',
				undefined,
				error,
			);
		}

		const status = error.response.status;
		const errorData = error.response.data;

		switch (status) {
			case 400: {
				const validationMessage = errorData?.error?.message || error.message;
				if (
					validationMessage.includes('insufficient stock') ||
					validationMessage.includes('negative stock')
				) {
					return this.createInventoryError(
						'Insufficient stock for this operation. Please check the current stock level.',
						'INSUFFICIENT_STOCK',
						status,
						errorData,
					);
				}
				return this.createInventoryError(
					validationMessage ||
						'Invalid request data. Please check your input and try again.',
					'VALIDATION_ERROR',
					status,
					errorData,
				);
			}

			case 401:
				return this.createInventoryError(
					'Authentication required. Please log in and try again.',
					'UNAUTHORIZED',
					status,
					errorData,
				);

			case 403:
				return this.createInventoryError(
					'You do not have permission to perform this operation.',
					'UNAUTHORIZED',
					status,
					errorData,
				);

			case 404:
				return this.createInventoryError(
					'The requested resource was not found.',
					'NOT_FOUND',
					status,
					errorData,
				);

			case 409:
				return this.createInventoryError(
					'Operation conflict detected. Please refresh the data and try again.',
					'CONFLICT',
					status,
					errorData,
				);

			case 429:
				return this.createInventoryError(
					'Too many requests. Please wait a moment and try again.',
					'SERVER_ERROR',
					status,
					errorData,
				);

			default:
				if (status >= 500) {
					return this.createInventoryError(
						'Server error occurred. Please try again later.',
						'SERVER_ERROR',
						status,
						errorData,
					);
				}
				return this.createInventoryError(
					errorData?.error?.message ||
						error.message ||
						'An unexpected error occurred.',
					'UNKNOWN_ERROR',
					status,
					errorData,
				);
		}
	}

	/**
	 * Execute request with retry logic
	 */
	private async executeWithRetry<T>(
		operation: () => Promise<T>,
		operationName: string,
		config: Partial<RetryConfig> = {},
	): Promise<T> {
		const retryConfig = { ...this.defaultRetryConfig, ...config };
		let lastError: any;

		for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error;

				// Don't retry if it's the last attempt or if retry condition is not met
				if (
					attempt === retryConfig.maxRetries ||
					!retryConfig.retryCondition?.(error)
				) {
					break;
				}

				// Calculate delay with exponential backoff
				const delay = Math.min(
					retryConfig.baseDelay * 2 ** attempt,
					retryConfig.maxDelay,
				);

				console.warn(
					`${operationName} attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
				);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		throw this.transformApiError(lastError, operationName);
	}

	/**
	 * Transform product data from API response
	 */
	private transformProduct(apiProduct: any): Product {
		return {
			...apiProduct,
			// Ensure numeric fields are properly typed
			stock: Number(apiProduct.stock) || 0,
			purchasePrice: Number(apiProduct.purchasePrice) || 0,
			salePrice: Number(apiProduct.salePrice) || 0,
			// Ensure dates are properly formatted
			createdAt: new Date(apiProduct.createdAt),
			updatedAt: new Date(apiProduct.updatedAt),
		};
	}

	/**
	 * Transform stock adjustment data from API response
	 */
	private transformStockAdjustment(apiAdjustment: any): StockAdjustment {
		return {
			...apiAdjustment,
			// Ensure numeric fields are properly typed
			quantity: Number(apiAdjustment.quantity) || 0,
			previousStock: Number(apiAdjustment.previousStock) || 0,
			newStock: Number(apiAdjustment.newStock) || 0,
			// Ensure date is properly formatted
			createdAt: apiAdjustment.createdAt,
		};
	}

	/**
	 * Search products using existing product API
	 * Optimized for inventory operations with quick search capabilities
	 */
	async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
		return this.executeWithRetry(
			async () => {
				const params = new URLSearchParams();
				if (query.trim()) {
					params.append('search', query.trim());
				}
				params.append('limit', Math.max(1, Math.min(100, limit)).toString());

				const url = `${this.baseUrl}/products?${params.toString()}`;
				const response = await httpClient.get<PaginatedResponse<Product>>(url);

				// Transform and validate response data
				const products = (response?.data || []).map((product) =>
					this.transformProduct(product),
				);
				return products;
			},
			'searchProducts',
			{
				// Don't retry search operations as aggressively
				maxRetries: 2,
				retryCondition: (error: any) => {
					// Only retry on network errors for search
					return !error.response;
				},
			},
		);
	}

	/**
	 * Adjust stock for a specific product
	 * Supports both adding and removing stock with audit trail
	 */
	async adjustStock(
		productId: string,
		adjustment: StockAdjustmentRequest,
	): Promise<Product> {
		// Client-side validation
		this.validateStockAdjustment(productId, adjustment);

		// Execute stock adjustment without retry to prevent duplicate operations
		try {
			const url = `${this.baseUrl}/products/${productId}/stock-adjustment`;
			const response = await httpClient.post<ApiResponse<Product>>(url, {
				...adjustment,
				// Ensure quantity is a positive number
				quantity: Math.abs(Number(adjustment.quantity)),
				// Trim and sanitize reason
				reason: adjustment.reason.trim(),
			});

			// Transform and validate response data
			return this.transformProduct(response.data);
		} catch (error) {
			// Transform error but don't retry to avoid duplicate stock adjustments
			throw this.transformApiError(error, 'adjustStock');
		}
	}

	/**
	 * Validate stock adjustment request data
	 */
	private validateStockAdjustment(
		productId: string,
		adjustment: StockAdjustmentRequest,
	): void {
		if (!productId?.trim()) {
			throw this.createInventoryError(
				'Product ID is required',
				'VALIDATION_ERROR',
			);
		}

		if (!adjustment.quantity || adjustment.quantity <= 0) {
			throw this.createInventoryError(
				'Quantity must be greater than 0',
				'VALIDATION_ERROR',
			);
		}

		if (!adjustment.reason?.trim()) {
			throw this.createInventoryError(
				'Reason is required for stock adjustment',
				'VALIDATION_ERROR',
			);
		}

		if (adjustment.reason.trim().length > 500) {
			throw this.createInventoryError(
				'Reason must be less than 500 characters',
				'VALIDATION_ERROR',
			);
		}

		if (!['add', 'remove'].includes(adjustment.adjustmentType)) {
			throw this.createInventoryError(
				'Invalid adjustment type. Must be "add" or "remove"',
				'VALIDATION_ERROR',
			);
		}
	}

	/**
	 * Get stock adjustment history with filtering and pagination
	 * Retrieves historical stock movements for audit and tracking purposes
	 */
	async getStockHistory(filters: StockHistoryFilters = {}): Promise<{
		data: StockAdjustment[];
		pagination: {
			total: number;
			page: number;
			limit: number;
			totalPages: number;
			hasNext: boolean;
			hasPrev: boolean;
		};
	}> {
		// Validate filters
		this.validateStockHistoryFilters(filters);

		return this.executeWithRetry(
			async () => {
				const params = new URLSearchParams();

				// Add filter parameters with validation
				if (filters.productId?.trim())
					params.append('productId', filters.productId.trim());
				if (filters.productCode?.trim())
					params.append('productCode', filters.productCode.trim());
				if (filters.adjustmentType)
					params.append('adjustmentType', filters.adjustmentType);
				if (filters.startDate) params.append('startDate', filters.startDate);
				if (filters.endDate) params.append('endDate', filters.endDate);
				if (filters.userId?.trim())
					params.append('userId', filters.userId.trim());

				// Ensure pagination parameters are within reasonable bounds
				const page = Math.max(1, filters.page || 1);
				const limit = Math.max(1, Math.min(100, filters.limit || 50));
				params.append('page', page.toString());
				params.append('limit', limit.toString());

				const queryString = params.toString();
				const url = `${this.baseUrl}/stock-adjustments?${queryString}`;

				const response =
					await httpClient.get<PaginatedResponse<StockAdjustment>>(url);

				// Transform and validate response data
				const transformedData = (response.data || []).map((adjustment) =>
					this.transformStockAdjustment(adjustment),
				);

				return {
					data: transformedData,
					pagination: response.pagination || {
						total: 0,
						page: 1,
						limit: 50,
						totalPages: 0,
						hasNext: false,
						hasPrev: false,
					},
				};
			},
			'getStockHistory',
			{
				// Allow retries for history fetching
				maxRetries: 2,
				retryCondition: (error: any) => {
					// Retry on network errors and 5xx errors, but not on 404
					return (
						!error.response ||
						(error.response.status >= 500 && error.response.status < 600)
					);
				},
			},
		);
	}

	/**
	 * Validate stock history filters
	 */
	private validateStockHistoryFilters(filters: StockHistoryFilters): void {
		if (filters.page && (filters.page < 1 || !Number.isInteger(filters.page))) {
			throw this.createInventoryError(
				'Page must be a positive integer',
				'VALIDATION_ERROR',
			);
		}

		if (
			filters.limit &&
			(filters.limit < 1 ||
				filters.limit > 100 ||
				!Number.isInteger(filters.limit))
		) {
			throw this.createInventoryError(
				'Limit must be between 1 and 100',
				'VALIDATION_ERROR',
			);
		}

		if (filters.startDate && filters.endDate) {
			const startDate = new Date(filters.startDate);
			const endDate = new Date(filters.endDate);

			if (startDate > endDate) {
				throw this.createInventoryError(
					'Start date must be before end date',
					'VALIDATION_ERROR',
				);
			}
		}

		if (
			filters.adjustmentType &&
			!['add', 'remove'].includes(filters.adjustmentType)
		) {
			throw this.createInventoryError(
				'Invalid adjustment type filter. Must be "add" or "remove"',
				'VALIDATION_ERROR',
			);
		}
	}

	/**
	 * Get a single product by ID
	 * Utility method for retrieving product details during stock operations
	 */
	async getProduct(productId: string): Promise<Product> {
		if (!productId?.trim()) {
			throw this.createInventoryError(
				'Product ID is required',
				'VALIDATION_ERROR',
			);
		}

		return this.executeWithRetry(
			async () => {
				const response = await httpClient.get<ApiResponse<Product>>(
					`${this.baseUrl}/products/${productId.trim()}`,
				);
				return this.transformProduct(response.data);
			},
			'getProduct',
			{
				maxRetries: 2,
			},
		);
	}

	/**
	 * Search products by code (exact match)
	 * Optimized for barcode scanning and direct code input
	 */
	async searchProductByCode(code: string): Promise<Product | null> {
		if (!code?.trim()) {
			return null;
		}

		try {
			const products = await this.searchProducts(code.trim(), 10);

			// Find exact code match (case-insensitive)
			const exactMatch = products.find(
				(p) => p.code.toLowerCase() === code.trim().toLowerCase(),
			);

			return exactMatch || null;
		} catch (error) {
			// For product search by code, we don't want to throw errors
			// Instead, return null to indicate no product found
			console.warn('Error searching product by code:', error);
			return null;
		}
	}

	/**
	 * Check if the service is available
	 * Utility method for health checks
	 */
	async isServiceAvailable(): Promise<boolean> {
		try {
			// Try a simple search with empty query to test connectivity
			await this.searchProducts('', 1);
			return true;
		} catch (error) {
			console.warn('Inventory service availability check failed:', error);
			return false;
		}
	}
}

// Create and export singleton instance
export const inventoryService = new InventoryService();
export default inventoryService;
