import { useCallback, useEffect, useState } from 'react';
import { authDebugLog } from '../config/environment';
import { authService } from '../services/authService';

interface UseAuthTokenReturn {
	token: string | null;
	isTokenValid: boolean;
	refreshToken: () => Promise<void>;
	clearToken: () => void;
}

/**
 * Custom hook for managing authentication tokens
 * Provides token validation, refresh, and cleanup functionality
 */
export const useAuthToken = (): UseAuthTokenReturn => {
	const [token, setToken] = useState<string | null>(null);
	const [isTokenValid, setIsTokenValid] = useState<boolean>(false);

	// Initialize token from storage
	useEffect(() => {
		const storedToken = localStorage.getItem('flowcrm_token');
		if (storedToken) {
			setToken(storedToken);
			setIsTokenValid(authService.isAuthenticated());
		}
	}, []);

	// Listen for token changes in localStorage (for multi-tab sync)
	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			if (event.key === 'flowcrm_token') {
				const newToken = event.newValue;
				setToken(newToken);
				setIsTokenValid(newToken ? authService.isAuthenticated() : false);
				authDebugLog('Token updated from storage event', {
					hasToken: !!newToken,
				});
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, []);

	// Refresh token function
	const refreshToken = useCallback(async () => {
		try {
			authDebugLog('Refreshing token via hook');
			const newToken = await authService.refreshToken();
			setToken(newToken);
			setIsTokenValid(true);
			authDebugLog('Token refreshed successfully via hook');
		} catch (error) {
			authDebugLog('Token refresh failed via hook:', error);
			setToken(null);
			setIsTokenValid(false);
			throw error;
		}
	}, []);

	// Clear token function
	const clearToken = useCallback(() => {
		authDebugLog('Clearing token via hook');
		setToken(null);
		setIsTokenValid(false);
		localStorage.removeItem('flowcrm_token');
		localStorage.removeItem('flowcrm_refresh_token');
	}, []);

	return {
		token,
		isTokenValid,
		refreshToken,
		clearToken,
	};
};

export default useAuthToken;
