import { authDebugLog } from '../config/environment';
import type {
	LoginRequest,
	LoginResponse,
	RefreshTokenResponse,
	User,
} from '../types/api';
import { tokenStorage } from '../utils/tokenStorage';
import { httpClient } from './httpClient';

export class AuthService {
	private static instance: AuthService;

	static getInstance(): AuthService {
		if (!AuthService.instance) {
			AuthService.instance = new AuthService();
		}
		return AuthService.instance;
	}

	/**
	 * Authenticate user with email and password
	 */
	async login(credentials: LoginRequest): Promise<LoginResponse> {
		try {
			authDebugLog('Attempting login for user:', credentials.email);
			console.log('Making login request...');

			// Use the configured httpClient which respects the Vite proxy
			const response = await httpClient.post<{ data: LoginResponse }>('/auth/login', credentials);
			const loginData = response.data as LoginResponse;
			console.log('Login successful:', loginData);

			const { token, refreshToken, user } = loginData;
			console.log('Destructured data:', {
				hasToken: !!token,
				hasRefreshToken: !!refreshToken,
				hasUser: !!user,
			});

			// Store tokens
			httpClient.setAuthTokens(token, refreshToken || '');

			authDebugLog('Login successful for user:', user.email);
			return loginData;
		} catch (error) {
			authDebugLog('Login failed:', error);
			console.log('Login error details:', error);
			
			// Clear any existing tokens on login failure
			httpClient.clearAuthTokens();
			
			throw error;
		}
	}

	/**
	 * Logout user
	 */
	async logout(): Promise<void> {
		try {
			await httpClient.post('/auth/logout');
		} catch (error) {
			console.warn('Logout request failed:', error);
		} finally {
			httpClient.clearAuthTokens();
		}
	}

	/**
	 * Get current user profile
	 */
	async getCurrentUser(): Promise<User> {
		try {
			const response = await httpClient.get<{ data: User }>('/auth/me');
			return response.data;
		} catch (error) {
			httpClient.clearAuthTokens();
			throw error;
		}
	}

	/**
	 * Refresh authentication token
	 */
	async refreshToken(): Promise<string> {
		try {
			const response = await httpClient.post<{ data: RefreshTokenResponse }>(
				'/auth/refresh',
			);
			const { token, refreshToken } = response.data;
			httpClient.setAuthTokens(token, refreshToken || '');
			return token;
		} catch (error) {
			httpClient.clearAuthTokens();
			throw error;
		}
	}

	/**
	 * Check if user is currently authenticated
	 */
	isAuthenticated(): boolean {
		const token = tokenStorage.getToken();
		if (!token) {
			return false;
		}

		try {
			// Parse JWT token to check expiration
			const payload = JSON.parse(atob(token.split('.')[1]));
			const currentTime = Date.now() / 1000;
			return payload.exp > currentTime;
		} catch (error) {
			authDebugLog('Token validation error:', error);
			return false;
		}
	}

	/**
	 * Initialize authentication state on app startup
	 */
	async initializeAuth(): Promise<User | null> {
		try {
			authDebugLog('Initializing authentication state');

			if (!this.isAuthenticated()) {
				authDebugLog('No valid authentication found');
				return null;
			}

			// Validate session with server
			const user = await this.getCurrentUser();
			authDebugLog('Authentication initialized successfully', {
				userId: user.id,
				email: user.email,
			});
			return user;
		} catch (error) {
			authDebugLog('Authentication initialization failed:', error);
			httpClient.clearAuthTokens();
			return null;
		}
	}
}

export const authService = AuthService.getInstance();
