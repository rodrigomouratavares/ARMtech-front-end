import type {
	ApiResponse,
	CreatePreSaleRequest,
	PaginatedResponse,
	PreSale,
	PreSaleQueryParams,
	UpdatePreSaleRequest,
} from '../types/api';
import { httpClient } from './httpClient';

export class PresaleService {
	private readonly baseUrl = '/presales';

	/**
	 * Get all pre-sales with optional filtering and pagination
	 */
	async getAll(
		params?: PreSaleQueryParams,
	): Promise<PaginatedResponse<PreSale>> {
		try {
			const queryParams = new URLSearchParams();

			if (params?.page) queryParams.append('page', params.page.toString());
			if (params?.limit) queryParams.append('limit', params.limit.toString());
			if (params?.status) queryParams.append('status', params.status);
			if (params?.customerId)
				queryParams.append('customerId', params.customerId);
			if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
			if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
			if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
			if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

			const url = queryParams.toString()
				? `${this.baseUrl}?${queryParams.toString()}`
				: this.baseUrl;

			// A API retorna: {success: true, data: [...], pagination: {...}}
			const apiResponse = await httpClient.get<{
				success: boolean;
				data: PreSale[];
				pagination: any;
				message: string;
				timestamp: string;
			}>(url);

			console.log('PresaleService - Raw API response:', apiResponse);

			// Verificar se a resposta tem a estrutura esperada
			if (
				apiResponse &&
				apiResponse.success &&
				Array.isArray(apiResponse.data)
			) {
				console.log('PresaleService - Valid API response:', {
					dataLength: apiResponse.data.length,
					firstItem: apiResponse.data[0],
				});

				// Retornar a resposta da API diretamente, pois já tem a estrutura correta
				return apiResponse;
			} else {
				console.error(
					'PresaleService - Invalid API response structure:',
					apiResponse,
				);
				throw new Error('Invalid API response structure');
			}
		} catch (error) {
			console.error('Error in presaleService.getAll:', error);
			// Return empty response structure on error
			return {
				data: [],
				success: false,
				message:
					error instanceof Error ? error.message : 'Failed to fetch presales',
				timestamp: new Date().toISOString(),
				pagination: {
					total: 0,
					page: params?.page || 1,
					limit: params?.limit || 20,
					totalPages: 0,
					hasNext: false,
					hasPrev: false,
				},
			};
		}
	}

	/**
	 * Get a specific pre-sale by ID
	 */
	async getById(id: string): Promise<ApiResponse<PreSale>> {
		try {
			const data = await httpClient.get<PreSale>(`${this.baseUrl}/${id}`);
			return {
				success: true,
				data,
				message: 'Presale retrieved successfully',
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			return {
				success: false,
				data: null as any,
				message:
					error instanceof Error ? error.message : 'Failed to fetch presale',
				timestamp: new Date().toISOString(),
			};
		}
	}

	/**
	 * Create a new pre-sale
	 */
	async create(
		presaleData: CreatePreSaleRequest,
	): Promise<ApiResponse<PreSale>> {
		try {
			const data = await httpClient.post<PreSale>(this.baseUrl, presaleData);
			return {
				success: true,
				data,
				message: 'Presale created successfully',
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			return {
				success: false,
				data: null as any,
				message:
					error instanceof Error ? error.message : 'Failed to create presale',
				timestamp: new Date().toISOString(),
			};
		}
	}

	/**
	 * Update an existing pre-sale
	 */
	async update(
		id: string,
		presaleData: UpdatePreSaleRequest,
	): Promise<ApiResponse<PreSale>> {
		try {
			const data = await httpClient.put<PreSale>(
				`${this.baseUrl}/${id}`,
				presaleData,
			);
			return {
				success: true,
				data,
				message: 'Presale updated successfully',
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			return {
				success: false,
				data: null as any,
				message:
					error instanceof Error ? error.message : 'Failed to update presale',
				timestamp: new Date().toISOString(),
			};
		}
	}

	/**
	 * Delete a pre-sale
	 */
	async delete(id: string): Promise<ApiResponse<void>> {
		try {
			await httpClient.delete<void>(`${this.baseUrl}/${id}`);
			return {
				success: true,
				data: undefined as any,
				message: 'Presale deleted successfully',
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			return {
				success: false,
				data: undefined as any,
				message:
					error instanceof Error ? error.message : 'Failed to delete presale',
				timestamp: new Date().toISOString(),
			};
		}
	}

	/**
	 * Update pre-sale status
	 */
	async updateStatus(
		id: string,
		status: PreSale['status'],
	): Promise<ApiResponse<PreSale>> {
		try {
			const data = await httpClient.patch<PreSale>(
				`${this.baseUrl}/${id}/status`,
				{ status },
			);
			return {
				success: true,
				data,
				message: 'Presale status updated successfully',
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			return {
				success: false,
				data: null as any,
				message:
					error instanceof Error
						? error.message
						: 'Failed to update presale status',
				timestamp: new Date().toISOString(),
			};
		}
	}

	/**
	 * Convert pre-sale to sale
	 */
	async convertToSale(id: string): Promise<ApiResponse<PreSale>> {
		try {
			const data = await httpClient.post<PreSale>(
				`${this.baseUrl}/${id}/convert`,
			);
			return {
				success: true,
				data,
				message: 'Presale converted to sale successfully',
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			return {
				success: false,
				data: null as any,
				message:
					error instanceof Error
						? error.message
						: 'Failed to convert presale to sale',
				timestamp: new Date().toISOString(),
			};
		}
	}

	/**
	 * Calculate pre-sale totals
	 */
	async calculateTotals(
		id: string,
		items: CreatePreSaleRequest['items'],
	): Promise<{ total: string; subtotal: string; discountAmount: string }> {
		return httpClient.post<{
			total: string;
			subtotal: string;
			discountAmount: string;
		}>(`${this.baseUrl}/${id}/calculate`, { items });
	}

	/**
	 * Get pre-sales by customer ID
	 */
	async getByCustomerId(
		customerId: string,
		params?: Omit<PreSaleQueryParams, 'customerId'>,
	): Promise<PaginatedResponse<PreSale>> {
		return this.getAll({ ...params, customerId });
	}

	/**
	 * Get pre-sales by status
	 */
	async getByStatus(
		status: PreSale['status'],
		params?: Omit<PreSaleQueryParams, 'status'>,
	): Promise<PaginatedResponse<PreSale>> {
		return this.getAll({ ...params, status });
	}

	/**
	 * Get pre-sales within date range
	 */
	async getByDateRange(
		dateFrom: string,
		dateTo: string,
		params?: Omit<PreSaleQueryParams, 'dateFrom' | 'dateTo'>,
	): Promise<PaginatedResponse<PreSale>> {
		return this.getAll({ ...params, dateFrom, dateTo });
	}

	/**
	 * Validate status transition
	 */
	validateStatusTransition(
		currentStatus: PreSale['status'],
		newStatus: PreSale['status'],
	): boolean {
		const validTransitions: Record<PreSale['status'], PreSale['status'][]> = {
			draft: ['pending', 'cancelled'],
			pending: ['approved', 'cancelled', 'converted'], // Agora permite conversão direta de pending
			approved: ['converted', 'cancelled'],
			cancelled: [], // Cannot transition from cancelled
			converted: [], // Cannot transition from converted
		};

		return validTransitions[currentStatus]?.includes(newStatus) || false;
	}

	/**
	 * Get next valid statuses for a pre-sale
	 */
	getValidNextStatuses(currentStatus: PreSale['status']): PreSale['status'][] {
		const validTransitions: Record<PreSale['status'], PreSale['status'][]> = {
			draft: ['pending', 'cancelled'],
			pending: ['approved', 'cancelled', 'converted'], // Agora permite conversão direta de pending
			approved: ['converted', 'cancelled'],
			cancelled: [],
			converted: [],
		};

		return validTransitions[currentStatus] || [];
	}

	/**
	 * Calculate pre-sale totals with discount
	 */
	calculatePresaleTotals(
		items: Array<{ quantity: string; unitPrice: string }>,
		discount?: string,
		discountType?: 'fixed' | 'percentage',
	): { subtotal: number; discountAmount: number; total: number } {
		const subtotal = items.reduce((sum, item) => {
			return sum + Number(item.quantity) * Number(item.unitPrice);
		}, 0);

		let discountAmount = 0;
		if (discount && Number(discount) > 0) {
			if (discountType === 'percentage') {
				discountAmount = (subtotal * Number(discount)) / 100;
			} else {
				discountAmount = Number(discount);
			}
		}

		const total = Math.max(0, subtotal - discountAmount);

		return {
			subtotal,
			discountAmount,
			total,
		};
	}

	/**
	 * Validate pre-sale data before creation/update
	 */
	validatePresaleData(data: CreatePreSaleRequest | UpdatePreSaleRequest): {
		isValid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		// Validate customer
		if ('customerId' in data && !data.customerId) {
			errors.push('Customer is required');
		}

		// Validate items
		if ('items' in data && data.items) {
			if (data.items.length === 0) {
				errors.push('At least one item is required');
			}

			data.items.forEach((item, index) => {
				if (!item.productId) {
					errors.push(`Item ${index + 1}: Product is required`);
				}
				if (!item.quantity || Number(item.quantity) <= 0) {
					errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
				}
				if (!item.unitPrice || Number(item.unitPrice) <= 0) {
					errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
				}
			});
		}

		// Validate discount
		if (data.discount && Number(data.discount) < 0) {
			errors.push('Discount cannot be negative');
		}

		if (
			data.discountType === 'percentage' &&
			data.discount &&
			Number(data.discount) > 100
		) {
			errors.push('Percentage discount cannot exceed 100%');
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Check if pre-sale can be edited
	 */
	canEditPresale(status: PreSale['status']): boolean {
		return ['draft', 'pending'].includes(status);
	}

	/**
	 * Check if pre-sale can be deleted
	 */
	canDeletePresale(status: PreSale['status']): boolean {
		return status !== 'converted';
	}

	/**
	 * Check if pre-sale can be converted to sale
	 */
	canConvertToSale(status: PreSale['status']): boolean {
		return status === 'approved' || status === 'pending'; // Agora permite conversão de pending também
	}
}

// Export singleton instance
export const presaleService = new PresaleService();
