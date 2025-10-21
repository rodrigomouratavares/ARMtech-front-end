/**
 * Utility functions for debugging session-related issues
 */

export interface SessionDebugInfo {
	hasToken: boolean;
	hasRefreshToken: boolean;
	hasLastActivity: boolean;
	lastActivity: string | null;
	lastActivityDate: Date | null;
	timeSinceActivity: number; // in minutes
	isActivityValid: boolean;
	sessionTimeout: number;
	allLocalStorageKeys: string[];
}

/**
 * Get comprehensive session debug information
 */
export const getSessionDebugInfo = (
	sessionTimeout: number = 30,
): SessionDebugInfo => {
	const token = localStorage.getItem('flowcrm_token');
	const refreshToken = localStorage.getItem('flowcrm_refresh_token');
	const lastActivity = localStorage.getItem('flowcrm_last_activity');

	let lastActivityDate: Date | null = null;
	let timeSinceActivity = 0;
	let isActivityValid = false;

	if (lastActivity) {
		try {
			lastActivityDate = new Date(lastActivity);
			const now = new Date();
			timeSinceActivity =
				(now.getTime() - lastActivityDate.getTime()) / (1000 * 60);
			isActivityValid = timeSinceActivity <= sessionTimeout;
		} catch (error) {
			console.error('Error parsing last activity date:', error);
		}
	}

	// Get all localStorage keys for debugging
	const allLocalStorageKeys: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key) {
			allLocalStorageKeys.push(key);
		}
	}

	return {
		hasToken: !!token,
		hasRefreshToken: !!refreshToken,
		hasLastActivity: !!lastActivity,
		lastActivity,
		lastActivityDate,
		timeSinceActivity,
		isActivityValid,
		sessionTimeout,
		allLocalStorageKeys: allLocalStorageKeys.filter((key) =>
			key.startsWith('flowcrm'),
		),
	};
};

/**
 * Log session debug information to console
 */
export const logSessionDebugInfo = (sessionTimeout?: number): void => {
	const debugInfo = getSessionDebugInfo(sessionTimeout);

	console.group('🔍 Session Debug Information');
	console.log('Token present:', debugInfo.hasToken);
	console.log('Refresh token present:', debugInfo.hasRefreshToken);
	console.log('Last activity present:', debugInfo.hasLastActivity);
	console.log('Last activity value:', debugInfo.lastActivity);
	console.log('Last activity date:', debugInfo.lastActivityDate);
	console.log(
		'Time since activity (minutes):',
		debugInfo.timeSinceActivity.toFixed(2),
	);
	console.log('Activity valid:', debugInfo.isActivityValid);
	console.log('Session timeout (minutes):', debugInfo.sessionTimeout);
	console.log('FlowCRM localStorage keys:', debugInfo.allLocalStorageKeys);
	console.groupEnd();
};

/**
 * Clear all FlowCRM related localStorage items
 */
export const clearFlowCRMStorage = (): void => {
	const keysToRemove = [
		'flowcrm_token',
		'flowcrm_refresh_token',
		'flowcrm_last_activity',
		'temp_reports_permission',
	];

	keysToRemove.forEach((key) => {
		localStorage.removeItem(key);
	});

	console.log('🧹 Cleared FlowCRM localStorage items:', keysToRemove);
};

/**
 * Reset session activity to current time
 */
export const resetSessionActivity = (): void => {
	const now = new Date().toISOString();
	localStorage.setItem('flowcrm_last_activity', now);
	console.log('🔄 Reset session activity to:', now);
};

/**
 * Check if session should be considered expired
 */
export const isSessionExpired = (sessionTimeout: number = 30): boolean => {
	const debugInfo = getSessionDebugInfo(sessionTimeout);
	return debugInfo.hasLastActivity && !debugInfo.isActivityValid;
};

/**
 * Detect and clean only truly corrupted session data (not expired data)
 */
export const detectAndCleanCorruptedData = (): boolean => {
	let wasCorrupted = false;

	// Check for invalid date in flowcrm_last_activity
	const lastActivity = localStorage.getItem('flowcrm_last_activity');
	if (lastActivity) {
		try {
			const date = new Date(lastActivity);
			if (isNaN(date.getTime())) {
				console.warn(
					'🚨 Corrupted flowcrm_last_activity detected (invalid date), clearing...',
				);
				localStorage.removeItem('flowcrm_last_activity');
				wasCorrupted = true;
			}
			// Removed the "too old" check - let the session timeout logic handle expiration
		} catch (error) {
			console.warn('🚨 Error parsing flowcrm_last_activity, clearing...');
			localStorage.removeItem('flowcrm_last_activity');
			wasCorrupted = true;
		}
	}

	// Check for invalid token format (only clear if truly malformed)
	const token = localStorage.getItem('flowcrm_token');
	if (token) {
		try {
			// Basic JWT format check (should have 3 parts separated by dots)
			const parts = token.split('.');
			if (parts.length !== 3) {
				console.warn('🚨 Invalid token format detected (not JWT), clearing...');
				localStorage.removeItem('flowcrm_token');
				localStorage.removeItem('flowcrm_refresh_token');
				wasCorrupted = true;
			} else {
				// Try to parse the payload - only clear if completely malformed
				try {
					const payload = JSON.parse(atob(parts[1]));
					// Only check for basic structure, don't validate expiration here
					if (typeof payload !== 'object' || payload === null) {
						console.warn(
							'🚨 Invalid token payload detected (not object), clearing...',
						);
						localStorage.removeItem('flowcrm_token');
						localStorage.removeItem('flowcrm_refresh_token');
						wasCorrupted = true;
					}
				} catch (parseError) {
					console.warn('🚨 Token payload not parseable, clearing...');
					localStorage.removeItem('flowcrm_token');
					localStorage.removeItem('flowcrm_refresh_token');
					wasCorrupted = true;
				}
			}
		} catch (error) {
			console.warn('🚨 Error processing token, clearing...');
			localStorage.removeItem('flowcrm_token');
			localStorage.removeItem('flowcrm_refresh_token');
			wasCorrupted = true;
		}
	}

	if (wasCorrupted) {
		console.log('🧹 Corrupted session data cleaned automatically');
	}

	return wasCorrupted;
};

/**
 * Force clean old or expired session data (more aggressive, for manual use)
 */
export const forceCleanOldSessionData = (): boolean => {
	let wasOld = false;

	// Check for very old session data (more than 24 hours)
	const lastActivity = localStorage.getItem('flowcrm_last_activity');
	if (lastActivity) {
		try {
			const date = new Date(lastActivity);
			if (!isNaN(date.getTime())) {
				const now = new Date();
				const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
				if (hoursDiff > 24) {
					console.warn(
						'🚨 Very old session data detected (>24h), force clearing...',
					);
					clearFlowCRMStorage();
					wasOld = true;
				}
			}
		} catch (error) {
			// Already handled by detectAndCleanCorruptedData
		}
	}

	// Check for expired tokens
	const token = localStorage.getItem('flowcrm_token');
	if (token && !wasOld) {
		try {
			const parts = token.split('.');
			if (parts.length === 3) {
				const payload = JSON.parse(atob(parts[1]));
				if (payload.exp) {
					const now = Math.floor(Date.now() / 1000);
					if (payload.exp < now) {
						console.warn('🚨 Expired token detected, force clearing...');
						localStorage.removeItem('flowcrm_token');
						localStorage.removeItem('flowcrm_refresh_token');
						wasOld = true;
					}
				}
			}
		} catch (error) {
			// Already handled by detectAndCleanCorruptedData
		}
	}

	if (wasOld) {
		console.log('🧹 Old/expired session data force cleaned');
	}

	return wasOld;
};
