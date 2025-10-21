import type { PaymentMethod } from '../types';
import type {
	CreatePaymentMethodRequest,
	UpdatePaymentMethodRequest,
} from '../types/api';
import { httpClient } from './httpClient';

export interface PaymentMethodFilters {
	search?: string;
	isActive?: boolean;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

/**
 * Payment Method API Service
 * Handles all payment method-related API operations
 */
export class PaymentMethodService {
	private readonly baseUrl = '/payment-methods';

	/**
	 * Get all payment methods
	 */
	async getAll(): Promise<PaymentMethod[]> {
		try {
			const response = await httpClient.get<{
				success: boolean;
				data: PaymentMethod[];
			}>(this.baseUrl);
			return response.data || [];
		} catch (error) {
			console.error('Error fetching payment methods:', error);
			throw new Error('Erro ao carregar formas de pagamento');
		}
	}

	/**
	 * Get payment method by ID
	 */
	async getById(id: string): Promise<PaymentMethod> {
		try {
			const response = await httpClient.get<{
				success: boolean;
				data: PaymentMethod;
			}>(`${this.baseUrl}/${id}`);
			return response.data;
		} catch (error) {
			console.error('Error fetching payment method:', error);
			throw new Error('Erro ao carregar forma de pagamento');
		}
	}

	/**
	 * Create new payment method
	 */
	async create(data: CreatePaymentMethodRequest): Promise<PaymentMethod> {
		try {
			const response = await httpClient.post<{
				success: boolean;
				data: PaymentMethod;
			}>(this.baseUrl, data);
			return response.data;
		} catch (error) {
			console.error('Error creating payment method:', error);
			if (error instanceof Error && error.message.includes('409')) {
				throw new Error('Código já existe. Escolha um código diferente.');
			}
			throw new Error('Erro ao criar forma de pagamento');
		}
	}

	/**
	 * Update payment method
	 */
	async update(
		id: string,
		data: UpdatePaymentMethodRequest,
	): Promise<PaymentMethod> {
		try {
			const response = await httpClient.put<{
				success: boolean;
				data: PaymentMethod;
			}>(`${this.baseUrl}/${id}`, data);
			return response.data;
		} catch (error) {
			console.error('Error updating payment method:', error);
			if (error instanceof Error && error.message.includes('409')) {
				throw new Error('Código já existe. Escolha um código diferente.');
			}
			throw new Error('Erro ao atualizar forma de pagamento');
		}
	}

	/**
	 * Delete payment method
	 */
	async delete(id: string): Promise<boolean> {
		try {
			await httpClient.delete<void>(`${this.baseUrl}/${id}`);
			return true;
		} catch (error) {
			console.error('Error deleting payment method:', error);
			if (error instanceof Error && error.message.includes('409')) {
				throw new Error(
					'Esta forma de pagamento está sendo usada e não pode ser excluída.',
				);
			}
			throw new Error('Erro ao excluir forma de pagamento');
		}
	}

	/**
	 * Toggle payment method active status
	 */
	async toggleActive(id: string, isActive: boolean): Promise<PaymentMethod> {
		try {
			const response = await httpClient.patch<{
				success: boolean;
				data: PaymentMethod;
			}>(`${this.baseUrl}/${id}/status`, { isActive });
			return response.data;
		} catch (error) {
			console.error('Error toggling payment method status:', error);
			throw new Error('Erro ao alterar status da forma de pagamento');
		}
	}
}

// Export singleton instance
export const paymentMethodService = new PaymentMethodService();
export default paymentMethodService;
