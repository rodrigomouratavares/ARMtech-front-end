import type {
	PaymentMethodReportData,
	ReportFilters,
	ReportSummary,
} from '../types';
import { httpClient } from './httpClient';

/**
 * Enhanced error class for reports service
 */
export class ReportsServiceError extends Error {
	code: 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'SERVER_ERROR' | 'TIMEOUT_ERROR';
	originalError?: any;

	constructor(
		message: string,
		code:
			| 'NETWORK_ERROR'
			| 'VALIDATION_ERROR'
			| 'SERVER_ERROR'
			| 'TIMEOUT_ERROR',
		originalError?: any,
	) {
		super(message);
		this.name = 'ReportsServiceError';
		this.code = code;
		this.originalError = originalError;
	}
}

/**
 * Service for handling reports API calls with enhanced error handling and retry logic
 */
class ReportsService {
	private readonly baseUrl = '/reports';
	private readonly maxRetries = 3;
	private readonly retryDelay = 1000; // 1 second base delay

	/**
	 * Sleep utility for retry delays
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Retry wrapper with exponential backoff
	 */
	private async withRetry<T>(
		operation: () => Promise<T>,
		retries: number = this.maxRetries,
	): Promise<T> {
		try {
			return await operation();
		} catch (error: any) {
			// Don't retry validation errors (4xx status codes)
			if (error.response?.status >= 400 && error.response?.status < 500) {
				throw error;
			}

			// Don't retry if no more attempts left
			if (retries <= 0) {
				throw error;
			}

			// Calculate delay with exponential backoff
			const delay = this.retryDelay * 2 ** (this.maxRetries - retries);

			console.warn(
				`Request failed, retrying in ${delay}ms... (${retries} attempts left)`,
				error.message,
			);

			await this.sleep(delay);
			return this.withRetry(operation, retries - 1);
		}
	}

	/**
	 * Enhanced error handling wrapper
	 */
	private handleError(error: any, context: string): never {
		console.error(`ReportsService error in ${context}:`, error);

		// Network/timeout errors
		if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
			throw new ReportsServiceError(
				'Tempo limite excedido. Verifique sua conexão com a internet.',
				'TIMEOUT_ERROR',
				error,
			);
		}

		// Network connection errors
		if (
			error.code === 'ENOTFOUND' ||
			error.code === 'ECONNREFUSED' ||
			!error.response
		) {
			throw new ReportsServiceError(
				'Erro de conexão. Verifique sua internet e tente novamente.',
				'NETWORK_ERROR',
				error,
			);
		}

		// HTTP status errors
		if (error.response) {
			const status = error.response.status;
			const message = error.response.data?.message || error.message;

			if (status >= 400 && status < 500) {
				// Client errors (validation, authentication, etc.)
				throw new ReportsServiceError(
					message || 'Erro de validação nos parâmetros enviados.',
					'VALIDATION_ERROR',
					error,
				);
			} else if (status >= 500) {
				// Server errors
				throw new ReportsServiceError(
					'Erro interno do servidor. Tente novamente em alguns minutos.',
					'SERVER_ERROR',
					error,
				);
			}
		}

		// Generic error fallback
		throw new ReportsServiceError(
			'Erro inesperado ao carregar relatório. Tente novamente.',
			'NETWORK_ERROR',
			error,
		);
	}

	/**
	 * Build query parameters for API requests
	 */
	private buildQueryParams(filters?: ReportFilters): URLSearchParams {
		const params = new URLSearchParams();

		if (filters?.dateRange) {
			params.append('startDate', filters.dateRange.startDate.toISOString());
			params.append('endDate', filters.dateRange.endDate.toISOString());
		}

		if (filters?.paymentMethodId) {
			params.append('paymentMethodId', filters.paymentMethodId);
		}

		return params;
	}

	/**
	 * Get payment methods report data with enhanced error handling and retry logic
	 */
	async getPaymentMethodsReport(
		filters?: ReportFilters,
	): Promise<PaymentMethodReportData[]> {
		try {
			const params = this.buildQueryParams(filters);
			const queryString = params.toString();
			const url = `${this.baseUrl}/payment-methods${queryString ? `?${queryString}` : ''}`;

			const response = await this.withRetry(async () => {
				return await httpClient.get<{
					success: boolean;
					data: PaymentMethodReportData[];
					message: string;
				}>(url);
			});

			// Extract data from standardized response
			if (!response || !response.success || !Array.isArray(response.data)) {
				throw new ReportsServiceError(
					'Formato de resposta inválido do servidor.',
					'SERVER_ERROR',
				);
			}

			return response.data;
		} catch (error: any) {
			if (error instanceof ReportsServiceError) {
				throw error;
			}
			this.handleError(error, 'getPaymentMethodsReport');
		}
	}

	/**
	 * Get report summary data with enhanced error handling and retry logic
	 */
	async getReportSummary(filters?: ReportFilters): Promise<ReportSummary> {
		try {
			const params = this.buildQueryParams(filters);
			const queryString = params.toString();
			const url = `${this.baseUrl}/summary${queryString ? `?${queryString}` : ''}`;

			const response = await this.withRetry(async () => {
				return await httpClient.get<{
					success: boolean;
					data: ReportSummary;
					message: string;
				}>(url);
			});

			// Extract data from standardized response
			if (
				!response ||
				!response.success ||
				!response.data ||
				typeof response.data !== 'object'
			) {
				throw new ReportsServiceError(
					'Formato de resposta inválido do servidor.',
					'SERVER_ERROR',
				);
			}

			// Ensure required fields exist in the data object
			const requiredFields = [
				'totalAmount',
				'totalSalesCount',
				'totalConvertedPresales',
			];
			for (const field of requiredFields) {
				if (!(field in response.data)) {
					throw new ReportsServiceError(
						'Dados incompletos recebidos do servidor.',
						'SERVER_ERROR',
					);
				}
			}

			// Convert date strings to Date objects if period exists
			const summaryData = { ...response.data };
			if (summaryData.period) {
				const startDate = new Date(summaryData.period.startDate);
				const endDate = new Date(summaryData.period.endDate);

				// Validate that dates are valid
				if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
					throw new ReportsServiceError(
						'Datas inválidas recebidas do servidor.',
						'SERVER_ERROR',
					);
				}

				summaryData.period = {
					startDate,
					endDate,
				};
			}

			return summaryData;
		} catch (error: any) {
			if (error instanceof ReportsServiceError) {
				throw error;
			}
			this.handleError(error, 'getReportSummary');
		}
	}
}

// Export singleton instance
export const reportsService = new ReportsService();
