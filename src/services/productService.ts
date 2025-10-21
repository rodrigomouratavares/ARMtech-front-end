import type { Product } from '../types';
import type {
	ApiResponse,
	CreateProductRequest,
	MarginMarkupRequest,
	MarginMarkupResult,
	PaginatedResponse,
	PriceCalculationRequest,
	PriceCalculationResult,
	UpdateProductRequest,
} from '../types/api';
import { httpClient } from './httpClient';

export interface ProductFilters {
	search?: string;
	unit?: string;
	saleType?: string;
	minStock?: number;
	maxStock?: number;
	minPrice?: number;
	maxPrice?: number;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

export interface ProductSearchParams {
	q?: string;
	category?: string;
	inStock?: boolean;
	limit?: number;
}

class ProductService {
	private readonly baseUrl = '/products';

	/**
	 * Get all products with filtering and pagination
	 */
	async getProducts(
		filters: ProductFilters = {},
	): Promise<PaginatedResponse<Product>> {
		const params = new URLSearchParams();

		// Add filter parameters
		if (filters.search) params.append('search', filters.search);
		if (filters.unit) params.append('unit', filters.unit);
		if (filters.saleType) params.append('saleType', filters.saleType);
		if (filters.minStock !== undefined)
			params.append('minStock', filters.minStock.toString());
		if (filters.maxStock !== undefined)
			params.append('maxStock', filters.maxStock.toString());
		if (filters.minPrice !== undefined)
			params.append('minPrice', filters.minPrice.toString());
		if (filters.maxPrice !== undefined)
			params.append('maxPrice', filters.maxPrice.toString());
		if (filters.page) params.append('page', filters.page.toString());
		if (filters.limit) params.append('limit', filters.limit.toString());
		if (filters.sortBy) params.append('sortBy', filters.sortBy);
		if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

		const queryString = params.toString();
		const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

		const response = await httpClient.get<PaginatedResponse<Product>>(url);

		// The API already returns a paginated response structure
		return response;
	}

	/**
	 * Get a single product by ID
	 */
	async getProduct(id: string): Promise<Product> {
		const response = await httpClient.get<Product>(`${this.baseUrl}/${id}`);

		return response;

		throw new Error('Failed to fetch product');
	}

	/**
	 * Search products with advanced filtering
	 */
	async searchProducts(params: ProductSearchParams): Promise<Product[]> {
		const searchParams = new URLSearchParams();

		// Use 'search' parameter instead of 'q' to match API specification
		if (params.q) searchParams.append('search', params.q);
		if (params.category) searchParams.append('category', params.category);
		if (params.inStock !== undefined)
			searchParams.append('inStock', params.inStock.toString());
		if (params.limit) searchParams.append('limit', params.limit.toString());

		const queryString = searchParams.toString();
		// Use the main products endpoint with search parameter
		const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

		const response = await httpClient.get<PaginatedResponse<Product>>(url);

		// Return the data array from the paginated response
		return response?.data || [];
	}

	/**
	 * Create a new product
	 */
	async createProduct(productData: CreateProductRequest): Promise<Product> {
		const response = await httpClient.post<Product>(this.baseUrl, productData);

		return response;
	}

	/**
	 * Update an existing product
	 */
	async updateProduct(
		id: string,
		productData: UpdateProductRequest,
	): Promise<Product> {
		const response = await httpClient.put<Product>(
			`${this.baseUrl}/${id}`,
			productData,
		);

		return response;
	}

	/**
	 * Delete a product (with dependency checks)
	 */
	async deleteProduct(id: string): Promise<void> {
		try {
			await httpClient.delete<void>(`${this.baseUrl}/${id}`);

			// Success - API returns 204 No Content which is handled by httpClient interceptor
		} catch (error: any) {
			// Handle specific error cases
			if (error.status === 409 || error.code === 'CONFLICT') {
				throw new Error(
					'Não é possível excluir este produto pois ele possui movimentações (pré-vendas) associadas.',
				);
			}

			if (error.status === 404) {
				throw new Error('Produto não encontrado.');
			}

			// Check for database constraint errors in the message
			if (
				error.message?.includes('delete from "products"') ||
				error.message?.includes('foreign key constraint') ||
				error.message?.includes('violates foreign key')
			) {
				throw new Error(
					'Não é possível excluir este produto pois ele possui movimentações (pré-vendas) associadas.',
				);
			}

			// Re-throw with original message if not a known error
			throw new Error(
				error.message || 'Erro ao excluir produto. Tente novamente.',
			);
		}
	}

	/**
	 * Calculate dynamic pricing for a product
	 */
	async calculatePrice(
		id: string,
		calculationData: PriceCalculationRequest,
	): Promise<PriceCalculationResult> {
		const response = await httpClient.post<PriceCalculationResult>(
			`${this.baseUrl}/${id}/calculate-price`,
			calculationData,
		);
		return response;
	}

	/**
	 * Calculate margin and markup for pricing analysis
	 */
	async calculateMarginMarkup(
		marginMarkupData: MarginMarkupRequest,
	): Promise<MarginMarkupResult> {
		const response = await httpClient.post<MarginMarkupResult>(
			`${this.baseUrl}/calculate-margin-markup`,
			marginMarkupData,
		);
		return response;
	}

	/**
	 * Get price suggestions for optimal pricing
	 */
	async getPriceSuggestions(
		id: string,
		basePrice?: string,
	): Promise<
		ApiResponse<{
			suggested: number;
			competitive: number;
			premium: number;
			budget: number;
		}>
	> {
		const params = new URLSearchParams();
		if (basePrice) params.append('basePrice', basePrice);

		const queryString = params.toString();
		const url = queryString
			? `${this.baseUrl}/${id}/price-suggestions?${queryString}`
			: `${this.baseUrl}/${id}/price-suggestions`;

		const response =
			await httpClient.get<
				ApiResponse<{
					suggested: number;
					competitive: number;
					premium: number;
					budget: number;
				}>
			>(url);
		return response;
	}

	/**
	 * Update product stock
	 */
	async updateStock(
		id: string,
		quantity: number,
		operation: 'add' | 'subtract' | 'set',
	): Promise<Product> {
		const response = await httpClient.patch<Product>(
			`${this.baseUrl}/${id}/stock`,
			{ quantity, operation },
		);

		return response;
	}

	/**
	 * Get products with low stock
	 */
	async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
		const response = await httpClient.get<PaginatedResponse<Product>>(
			`${this.baseUrl}/low-stock?threshold=${threshold}`,
		);

		return response?.data || [];
	}

	/**
	 * Bulk update products
	 */
	async bulkUpdateProducts(
		updates: Array<{ id: string; data: Partial<UpdateProductRequest> }>,
	): Promise<Product[]> {
		const response = await httpClient.patch<Product[]>(
			`${this.baseUrl}/bulk-update`,
			{ updates },
		);
		return response;
	}

	/**
	 * Export products data
	 */
	async exportProducts(
		format: 'csv' | 'xlsx' = 'csv',
		filters?: ProductFilters,
	): Promise<Blob> {
		const params = new URLSearchParams();
		params.append('format', format);

		// Add filter parameters for export
		if (filters) {
			if (filters.search) params.append('search', filters.search);
			if (filters.unit) params.append('unit', filters.unit);
			if (filters.saleType) params.append('saleType', filters.saleType);
			if (filters.minStock !== undefined)
				params.append('minStock', filters.minStock.toString());
			if (filters.maxStock !== undefined)
				params.append('maxStock', filters.maxStock.toString());
		}

		const response = await httpClient.get<Blob>(
			`${this.baseUrl}/export?${params.toString()}`,
			{
				responseType: 'blob',
			} as any,
		);

		return response;
	}
}

// Create and export a singleton instance
export const productService = new ProductService();
export default productService;
