import Cookies from 'js-cookie';
import { authDebugLog, config, isProduction } from '../config/environment';

export interface TokenStorage {
	getToken(): string | null;
	getRefreshToken(): string | null;
	setToken(token: string): void;
	setRefreshToken(refreshToken: string): void;
	setTokens(token: string, refreshToken: string): void;
	removeToken(): void;
	removeRefreshToken(): void;
	clearTokens(): void;
	isTokenExpired(token: string): boolean;
}

/**
 * Secure token storage implementation
 * Uses httpOnly cookies in production and localStorage in development
 */
class SecureTokenStorage implements TokenStorage {
	private useSecureCookies: boolean;

	constructor() {
		// Use secure cookies in production, localStorage in development for easier debugging
		this.useSecureCookies = isProduction() && config.secureCookies;
		authDebugLog('Token storage initialized', {
			useSecureCookies: this.useSecureCookies,
		});
	}

	getToken(): string | null {
		let token: string | null = null;
		if (this.useSecureCookies) {
			token = Cookies.get(config.tokenStorageKey) || null;
		} else {
			token = localStorage.getItem(config.tokenStorageKey);
		}

		return token;
	}

	getRefreshToken(): string | null {
		if (this.useSecureCookies) {
			return Cookies.get(config.refreshTokenStorageKey) || null;
		} else {
			return localStorage.getItem(config.refreshTokenStorageKey);
		}
	}

	setToken(token: string): void {
		if (this.useSecureCookies) {
			const cookieOptions: Cookies.CookieAttributes = {
				secure: true,
				sameSite: 'strict',
				expires: 7, // 7 days
			};
			Cookies.set(config.tokenStorageKey, token, cookieOptions);
		} else {
			localStorage.setItem(config.tokenStorageKey, token);
		}
		authDebugLog('Token stored successfully');
	}

	setRefreshToken(refreshToken: string): void {
		if (this.useSecureCookies) {
			const cookieOptions: Cookies.CookieAttributes = {
				secure: true,
				sameSite: 'strict',
				expires: 7, // 7 days
			};
			Cookies.set(config.refreshTokenStorageKey, refreshToken, cookieOptions);
		} else {
			localStorage.setItem(config.refreshTokenStorageKey, refreshToken);
		}
		authDebugLog('Refresh token stored successfully');
	}

	setTokens(token: string, refreshToken: string): void {
		this.setToken(token);
		this.setRefreshToken(refreshToken);

		// Dispatch storage event for cross-tab synchronization
		window.dispatchEvent(
			new StorageEvent('storage', {
				key: config.tokenStorageKey,
				newValue: token,
				storageArea: localStorage,
			}),
		);
	}

	removeToken(): void {
		if (this.useSecureCookies) {
			Cookies.remove(config.tokenStorageKey);
		} else {
			localStorage.removeItem(config.tokenStorageKey);
		}
		authDebugLog('Token removed successfully');
	}

	removeRefreshToken(): void {
		if (this.useSecureCookies) {
			Cookies.remove(config.refreshTokenStorageKey);
		} else {
			localStorage.removeItem(config.refreshTokenStorageKey);
		}
		authDebugLog('Refresh token removed successfully');
	}

	clearTokens(): void {
		this.removeToken();
		this.removeRefreshToken();

		// Dispatch storage event for cross-tab synchronization
		window.dispatchEvent(
			new StorageEvent('storage', {
				key: config.tokenStorageKey,
				newValue: null,
				storageArea: localStorage,
			}),
		);
	}

	isTokenExpired(token: string): boolean {
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			const currentTime = Date.now() / 1000;
			const timeUntilExpiry = (payload.exp - currentTime) * 1000;

			// Check if token expires within the refresh threshold
			const isExpired = timeUntilExpiry <= config.tokenRefreshThreshold;

			authDebugLog('Token expiration check', {
				expiresAt: new Date(payload.exp * 1000),
				timeUntilExpiry,
				threshold: config.tokenRefreshThreshold,
				isExpired,
			});

			return isExpired;
		} catch (error) {
			authDebugLog('Error parsing token for expiration check:', error);
			return true;
		}
	}
}

/**
 * Simple localStorage-based token storage for development
 */
class SimpleTokenStorage implements TokenStorage {
	getToken(): string | null {
		return localStorage.getItem(config.tokenStorageKey);
	}

	getRefreshToken(): string | null {
		return localStorage.getItem(config.refreshTokenStorageKey);
	}

	setToken(token: string): void {
		localStorage.setItem(config.tokenStorageKey, token);
		authDebugLog('Token stored in localStorage');
	}

	setRefreshToken(refreshToken: string): void {
		localStorage.setItem(config.refreshTokenStorageKey, refreshToken);
		authDebugLog('Refresh token stored in localStorage');
	}

	setTokens(token: string, refreshToken: string): void {
		this.setToken(token);
		this.setRefreshToken(refreshToken);
	}

	removeToken(): void {
		localStorage.removeItem(config.tokenStorageKey);
		authDebugLog('Token removed from localStorage');
	}

	removeRefreshToken(): void {
		localStorage.removeItem(config.refreshTokenStorageKey);
		authDebugLog('Refresh token removed from localStorage');
	}

	clearTokens(): void {
		this.removeToken();
		this.removeRefreshToken();
	}

	isTokenExpired(token: string): boolean {
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			const currentTime = Date.now() / 1000;
			return payload.exp <= currentTime;
		} catch (error) {
			authDebugLog('Error parsing token:', error);
			return true;
		}
	}
}

// Export singleton instance
export const tokenStorage: TokenStorage = config.secureCookies
	? new SecureTokenStorage()
	: new SimpleTokenStorage();

// Export classes for testing
export { SecureTokenStorage, SimpleTokenStorage };
