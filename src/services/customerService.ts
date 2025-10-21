import type {
	CreateCustomerRequest,
	Customer,
	CustomerQueryParams,
	PaginatedResponse,
	UpdateCustomerRequest,
} from '../types/api';
import { httpClient } from './httpClient';

/**
 * Customer API Service
 * Handles all customer-related API operations
 */
export class CustomerService {
	private readonly baseUrl = '/customers';

	/**
	 * Get all customers with pagination and filtering
	 */
	async getCustomers(
		params?: CustomerQueryParams,
	): Promise<PaginatedResponse<Customer>> {
		const queryParams = new URLSearchParams();

		if (params?.page) {
			queryParams.append('page', params.page.toString());
		}
		if (params?.limit) {
			queryParams.append('limit', params.limit.toString());
		}
		if (params?.search) {
			queryParams.append('search', params.search);
		}
		if (params?.sortBy) {
			queryParams.append('sortBy', params.sortBy);
		}
		if (params?.sortOrder) {
			queryParams.append('sortOrder', params.sortOrder);
		}

		const url = queryParams.toString()
			? `${this.baseUrl}?${queryParams.toString()}`
			: this.baseUrl;

		// A API retorna uma estrutura paginada
		const response = await httpClient.get<PaginatedResponse<Customer>>(url);

		// A API já retorna a estrutura paginada correta
		return response;
	}

	/**
	 * Get a single customer by ID
	 */
	async getCustomer(id: string): Promise<Customer> {
		return httpClient.get<Customer>(`${this.baseUrl}/${id}`);
	}

	/**
	 * Create a new customer
	 */
	async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
		return httpClient.post<Customer>(this.baseUrl, customerData);
	}

	/**
	 * Update an existing customer
	 */
	async updateCustomer(
		id: string,
		customerData: UpdateCustomerRequest,
	): Promise<Customer> {
		return httpClient.put<Customer>(`${this.baseUrl}/${id}`, customerData);
	}

	/**
	 * Delete a customer
	 */
	async deleteCustomer(id: string): Promise<void> {
		try {
			await httpClient.delete<void>(`${this.baseUrl}/${id}`);
		} catch (error: any) {
			// Verifica se é um erro de restrição de chave estrangeira
			if (
				error.response?.data?.message?.includes('foreign key constraint') ||
				error.message?.includes('foreign key constraint') ||
				error.message?.includes('violates foreign key')
			) {
				throw new Error(
					'Não é possível excluir este cliente pois ele possui pré-vendas associadas.',
				);
			}
			throw error;
		}
	}

	/**
	 * Search customers by name, email, or CPF
	 */
	async searchCustomers(
		query: string,
		params?: Omit<CustomerQueryParams, 'search'>,
	): Promise<PaginatedResponse<Customer>> {
		return this.getCustomers({ ...params, search: query });
	}
}

// Export singleton instance
export const customerService = new CustomerService();
export default customerService;
