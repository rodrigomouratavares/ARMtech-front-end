import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SessionInfo {
	isActive: boolean;
	timeRemaining: number; // in minutes
	lastActivity: Date | null;
	sessionTimeout: number; // in minutes
	warningThreshold: number; // in minutes
	showWarning: boolean;
}

interface UseSession extends SessionInfo {
	extendSession: () => void;
	getSessionStatus: () => 'active' | 'warning' | 'expired';
}

/**
 * Hook for managing user session information and warnings
 */
export const useSession = (): UseSession => {
	const { user, logout } = useAuth();
	const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
		isActive: false,
		timeRemaining: 0,
		lastActivity: null,
		sessionTimeout: 30, // 30 minutes default
		warningThreshold: 5, // Show warning when 5 minutes remaining
		showWarning: false,
	});

	// Update session information
	const updateSessionInfo = useCallback(() => {
		if (!user) {
			setSessionInfo((prev) => ({
				...prev,
				isActive: false,
				timeRemaining: 0,
				lastActivity: null,
				showWarning: false,
			}));
			return;
		}

		const lastActivityStr = localStorage.getItem('flowcrm_last_activity');
		if (!lastActivityStr) {
			// Set initial activity timestamp for new sessions
			const now = new Date();
			localStorage.setItem('flowcrm_last_activity', now.toISOString());
			setSessionInfo((prev) => ({
				...prev,
				isActive: true,
				timeRemaining: prev.sessionTimeout,
				lastActivity: now,
				showWarning: false,
			}));
			return;
		}

		const lastActivity = new Date(lastActivityStr);
		const now = new Date();
		const timeSinceActivity =
			(now.getTime() - lastActivity.getTime()) / (1000 * 60); // minutes
		const timeRemaining = Math.max(
			0,
			sessionInfo.sessionTimeout - timeSinceActivity,
		);
		const showWarning =
			timeRemaining <= sessionInfo.warningThreshold && timeRemaining > 0;

		setSessionInfo((prev) => ({
			...prev,
			isActive: timeRemaining > 0,
			timeRemaining,
			lastActivity,
			showWarning,
		}));

		// Auto-logout if session expired (but not during initial load)
		if (timeRemaining <= 0 && timeSinceActivity > sessionInfo.sessionTimeout) {
			console.warn('Session expired, logging out user');
			logout();
		}
	}, [user, logout, sessionInfo.sessionTimeout, sessionInfo.warningThreshold]);

	// Extend session by updating last activity
	const extendSession = useCallback(() => {
		if (user) {
			localStorage.setItem('flowcrm_last_activity', new Date().toISOString());
			updateSessionInfo();
		}
	}, [user, updateSessionInfo]);

	// Get session status
	const getSessionStatus = useCallback((): 'active' | 'warning' | 'expired' => {
		if (!sessionInfo.isActive) return 'expired';
		if (sessionInfo.showWarning) return 'warning';
		return 'active';
	}, [sessionInfo.isActive, sessionInfo.showWarning]);

	// Update session info periodically
	useEffect(() => {
		if (!user) return;

		updateSessionInfo();
		const interval = setInterval(updateSessionInfo, 30000); // Update every 30 seconds

		return () => clearInterval(interval);
	}, [user, updateSessionInfo]);

	return {
		...sessionInfo,
		extendSession,
		getSessionStatus,
	};
};

export default useSession;
