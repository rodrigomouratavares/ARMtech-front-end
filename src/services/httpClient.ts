import axios, {
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosResponse,
} from 'axios';
import { config } from '../config';
import { tokenStorage } from '../utils/tokenStorage';

/**
 * HTTP Client Service
 * Provides a configured axios instance with authentication and error handling
 */
class HttpClient {
	private axiosInstance: AxiosInstance;

	constructor() {
		console.log('HttpClient initialized with baseURL:', config.apiBaseUrl);
		console.log('Full config object:', config);
		console.log('Environment variables check:', {
			VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
			MODE: import.meta.env.MODE,
			PROD: import.meta.env.PROD,
		});

		// Use proxy in development, direct API in production
		const baseURL = config.appEnvironment === 'development' ? '/api' : config.apiBaseUrl;

		this.axiosInstance = axios.create({
			baseURL,
			timeout: 15000,
			headers: {
				'Content-Type': 'application/json',
			},
			withCredentials: false,
			validateStatus: (status) => status >= 200 && status < 300,
		});

		this.setupInterceptors();
	}

	private setupInterceptors(): void {
		// Request interceptor for authentication
		this.axiosInstance.interceptors.request.use(
			(config) => {
				console.log('Request interceptor:', {
					url: config.url,
					baseURL: config.baseURL,
					method: config.method,
				});

				const token = tokenStorage.getToken();
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}

				return config;
			},
			(error) => {
				console.error('Request interceptor error:', error);
				return Promise.reject(error);
			},
		);

		// Response interceptor for error handling
		this.axiosInstance.interceptors.response.use(
			(response: AxiosResponse) => {
				return response;
			},
			(error) => {
				console.error('HTTP Client Error:', {
					message: error.message,
					status: error.response?.status,
					statusText: error.response?.statusText,
					url: error.config?.url,
					baseURL: error.config?.baseURL,
					fullURL: error.config?.baseURL + error.config?.url,
				});

				// Handle 401 errors by clearing token
				if (error.response?.status === 401) {
					// Don't auto-redirect if this is a login request
					const isLoginRequest =
						error.config?.url?.includes('login') ||
						error.config?.url?.includes('auth');

					if (!isLoginRequest) {
						tokenStorage.removeToken();
						// Dispatch logout event instead of direct redirect
						if (typeof window !== 'undefined') {
							window.dispatchEvent(
								new CustomEvent('auth:logout', {
									detail: { reason: 'token_expired' },
								}),
							);
						}
					}
				}
				return Promise.reject(error);
			},
		);
	}

	async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.axiosInstance.get<T>(url, config);
		return response.data;
	}

	async post<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig,
	): Promise<T> {
		console.log('Making POST request:', {
			url,
			baseURL: this.axiosInstance.defaults.baseURL,
			fullURL: `${this.axiosInstance.defaults.baseURL}${url}`,
			data,
		});

		const response = await this.axiosInstance.post<T>(url, data, config);
		return response.data;
	}

	async put<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig,
	): Promise<T> {
		const response = await this.axiosInstance.put<T>(url, data, config);
		return response.data;
	}

	async patch<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig,
	): Promise<T> {
		const response = await this.axiosInstance.patch<T>(url, data, config);
		return response.data;
	}

	async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.axiosInstance.delete<T>(url, config);
		return response.data;
	}

	// Authentication token management
	setAuthTokens(token: string, refreshToken: string): void {
		tokenStorage.setToken(token);
		if (refreshToken) {
			tokenStorage.setRefreshToken(refreshToken);
		}
	}

	clearAuthTokens(): void {
		tokenStorage.removeToken();
		tokenStorage.removeRefreshToken();
	}

	// Get the axios instance for advanced usage
	getInstance(): AxiosInstance {
		return this.axiosInstance;
	}
}

// Export singleton instance
export const httpClient = new HttpClient();
export default httpClient;
