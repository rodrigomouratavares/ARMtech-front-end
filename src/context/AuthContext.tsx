import type React from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useReducer,
} from 'react';
import { authDebugLog } from '../config/environment';
import { authService } from '../services/authService';
import type {
	AuthContextType,
	AuthError,
	AuthUser,
	UserCredentials,
	UserPermissions,
} from '../types';
import type { User } from '../types/api';
import {
	detectAndCleanCorruptedData,
	logSessionDebugInfo,
} from '../utils/sessionDebug';

// Auth state interface for reducer
interface AuthState {
	user: AuthUser | null;
	isLoading: boolean;
	error: AuthError | null;
	isInitialized: boolean;
	permissions: UserPermissions | null;
	lastActivity: Date | null;
	sessionTimeout: number; // in minutes
}

// Auth actions for reducer
type AuthAction =
	| { type: 'INIT_START' }
	| {
			type: 'INIT_SUCCESS';
			payload: { user: AuthUser | null; permissions: UserPermissions | null };
	  }
	| { type: 'LOGIN_START' }
	| {
			type: 'LOGIN_SUCCESS';
			payload: { user: AuthUser; permissions: UserPermissions };
	  }
	| { type: 'LOGIN_ERROR'; payload: AuthError }
	| { type: 'LOGOUT' }
	| { type: 'CLEAR_ERROR' }
	| { type: 'UPDATE_PERMISSIONS'; payload: UserPermissions }
	| { type: 'UPDATE_ACTIVITY' }
	| { type: 'SESSION_EXPIRED' };

// Initial auth state
const initialState: AuthState = {
	user: null,
	isLoading: true,
	error: null,
	isInitialized: false,
	permissions: null,
	lastActivity: null,
	sessionTimeout: 30, // 30 minutes default
};

// Auth reducer for state management
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
	switch (action.type) {
		case 'INIT_START':
			return {
				...state,
				isLoading: true,
				error: null,
			};

		case 'INIT_SUCCESS':
			return {
				...state,
				user: action.payload.user,
				permissions: action.payload.permissions,
				isLoading: false,
				isInitialized: true,
				error: null,
			};

		case 'LOGIN_START':
			return {
				...state,
				isLoading: true,
				error: null,
			};

		case 'LOGIN_SUCCESS':
			return {
				...state,
				user: action.payload.user,
				permissions: action.payload.permissions,
				isLoading: false,
				error: null,
				lastActivity: new Date(),
			};

		case 'LOGIN_ERROR':
			return {
				...state,
				user: null,
				permissions: null,
				isLoading: false,
				error: action.payload,
			};

		case 'LOGOUT':
			return {
				...state,
				user: null,
				permissions: null,
				isLoading: false,
				error: null,
				lastActivity: null,
			};

		case 'UPDATE_ACTIVITY':
			return {
				...state,
				lastActivity: new Date(),
			};

		case 'SESSION_EXPIRED':
			return {
				...state,
				user: null,
				permissions: null,
				isLoading: false,
				error: {
					message: 'Sua sessão expirou. Faça login novamente.',
					code: 'SESSION_EXPIRED',
				},
				lastActivity: null,
			};

		case 'CLEAR_ERROR':
			return {
				...state,
				error: null,
			};

		case 'UPDATE_PERMISSIONS':
			return {
				...state,
				permissions: action.payload,
			};

		default:
			return state;
	}
};

// Create AuthContext
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use AuthContext
export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

// AuthProvider component props
interface AuthProviderProps {
	children: React.ReactNode;
}

// Helper function to extract permissions from API User
const extractPermissionsFromUser = (user: User): UserPermissions => {
	let permissions: UserPermissions;

	// Use permissions from database if available, otherwise use defaults based on role
	if (user.permissions) {
		permissions = user.permissions as UserPermissions;
	} else {
		// Fallback to default permissions based on role
		if (user.role === 'admin') {
			permissions = {
				modules: {
					products: true,
					customers: true,
					reports: true,
					paymentMethods: true,
					userManagement: true,
				},
				presales: {
					canCreate: true,
					canViewOwn: true,
					canViewAll: true,
				},
			};
		} else {
			permissions = {
				modules: {
					products: true,
					customers: true,
					reports: false,
					paymentMethods: false,
					userManagement: false,
				},
				presales: {
					canCreate: true,
					canViewOwn: true,
					canViewAll: false,
				},
			};
		}
	}

	// Check for temporary permissions (for testing purposes)
	if (process.env.NODE_ENV === 'development') {
		const tempReportsPermission = localStorage.getItem(
			'temp_reports_permission',
		);
		if (tempReportsPermission === 'true') {
			permissions = {
				...permissions,
				modules: {
					...permissions.modules,
					reports: true,
				},
			};
		}
	}

	return permissions;
};

// Helper function to convert API User to AuthUser
const convertApiUserToAuthUser = (user: User): AuthUser => {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		password: '', // Don't store password in context
		userType: user.role === 'admin' ? 'admin' : 'employee',
		permissions: extractPermissionsFromUser(user),
		isActive: true,
		createdAt: new Date(user.createdAt),
		updatedAt: new Date(user.updatedAt),
		lastLoginAt: new Date(),
	};
};

// AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	// Initialize auth state from stored tokens on mount
	useEffect(() => {
		const initializeAuth = async () => {
			dispatch({ type: 'INIT_START' });

			try {
				authDebugLog('Initializing authentication context');

				// Only check for obviously corrupted data during initialization
				// Let the authService handle token validation and expiration
				authDebugLog('Initializing with existing tokens if valid');

				// Try to initialize auth with stored tokens
				const user = await authService.initializeAuth();

				let authUser: AuthUser | null = null;
				let permissions: UserPermissions | null = null;

				if (user) {
					// Convert API User to AuthUser and extract permissions
					authUser = convertApiUserToAuthUser(user);
					permissions = extractPermissionsFromUser(user);

					authDebugLog('Authentication initialized successfully', {
						userId: user.id,
						email: user.email,
					});
				} else {
					authDebugLog('No valid authentication found');
				}

				dispatch({
					type: 'INIT_SUCCESS',
					payload: { user: authUser, permissions },
				});
			} catch (error) {
				authDebugLog('Failed to initialize authentication:', error);

				// Clear potentially corrupted data on initialization failure
				localStorage.removeItem('flowcrm_last_activity');
				localStorage.removeItem('flowcrm_token');
				localStorage.removeItem('flowcrm_refresh_token');

				dispatch({
					type: 'INIT_SUCCESS',
					payload: { user: null, permissions: null },
				});
			}
		};

		initializeAuth();
	}, []);

	// Login function
	const login = useCallback(async (credentials: UserCredentials) => {
		dispatch({ type: 'LOGIN_START' });

		try {
			authDebugLog('Attempting login', { email: credentials.email });

			// Only clean obviously corrupted data before login (not expired data)
			const hasCorruptedData = detectAndCleanCorruptedData();
			if (hasCorruptedData) {
				authDebugLog('Corrupted session data was cleaned before login');
			}

			console.log('AuthContext: Calling authService.login...');
			const loginResponse = await authService.login(credentials);
			console.log('AuthContext: Login response received:', loginResponse);

			console.log('AuthContext: Converting user...');
			const authUser = convertApiUserToAuthUser(loginResponse.user);
			console.log('AuthContext: User converted:', authUser);

			console.log('AuthContext: Extracting permissions...');
			const permissions = extractPermissionsFromUser(loginResponse.user);
			console.log('AuthContext: Permissions extracted:', permissions);

			console.log('AuthContext: Dispatching LOGIN_SUCCESS...');
			dispatch({
				type: 'LOGIN_SUCCESS',
				payload: { user: authUser, permissions },
			});

			// Set initial activity timestamp for successful login
			localStorage.setItem('flowcrm_last_activity', new Date().toISOString());

			console.log('AuthContext: Login process completed successfully');
			authDebugLog('Login successful', {
				userId: authUser.id,
				email: authUser.email,
			});
		} catch (error) {
			authDebugLog('Login failed:', error);

			// Clear potentially corrupted data on login failure
			localStorage.removeItem('flowcrm_last_activity');
			localStorage.removeItem('flowcrm_token');
			localStorage.removeItem('flowcrm_refresh_token');

			const authError: AuthError = {
				message: error instanceof Error ? error.message : 'Login failed',
				code: 'INVALID_CREDENTIALS',
			};

			dispatch({ type: 'LOGIN_ERROR', payload: authError });
			throw authError; // Re-throw for component handling
		}
	}, []);

	// Logout function
	const logout = useCallback(async () => {
		try {
			authDebugLog('Attempting logout');
			await authService.logout();
			dispatch({ type: 'LOGOUT' });
			authDebugLog('Logout successful');
		} catch (error) {
			authDebugLog('Logout error (proceeding anyway):', error);
			// Even if server logout fails, clear local state
			dispatch({ type: 'LOGOUT' });
		}
	}, []);

	// Clear error function
	const clearError = useCallback(() => {
		dispatch({ type: 'CLEAR_ERROR' });
	}, []);

	// Update activity function
	const updateActivity = useCallback(() => {
		if (state.user && !state.isLoading) {
			dispatch({ type: 'UPDATE_ACTIVITY' });
			localStorage.setItem('flowcrm_last_activity', new Date().toISOString());
		}
	}, [state.user, state.isLoading]);

	// Listen for auth events from HTTP client
	useEffect(() => {
		const handleAuthLogout = (event: CustomEvent) => {
			authDebugLog('Auth logout event received:', event.detail);
			dispatch({ type: 'LOGOUT' });
		};

		window.addEventListener('auth:logout', handleAuthLogout as EventListener);

		return () => {
			window.removeEventListener(
				'auth:logout',
				handleAuthLogout as EventListener,
			);
		};
	}, []);

	// Session timeout monitoring
	useEffect(() => {
		if (!state.user || !state.isInitialized || state.isLoading) return;

		const checkSessionTimeout = () => {
			// Don't check timeout if user is currently logging in
			if (state.isLoading) return;

			const lastActivity = localStorage.getItem('flowcrm_last_activity');
			if (lastActivity) {
				const lastActivityDate = new Date(lastActivity);
				const now = new Date();
				const timeDiff =
					(now.getTime() - lastActivityDate.getTime()) / (1000 * 60); // minutes

				authDebugLog('Session timeout check', {
					timeDiff: timeDiff.toFixed(2),
					sessionTimeout: state.sessionTimeout,
					lastActivity,
					willExpire: timeDiff > state.sessionTimeout,
				});

				if (timeDiff > state.sessionTimeout) {
					authDebugLog('Session timeout detected - logging out user');
					logSessionDebugInfo(state.sessionTimeout);
					authService.logout();
					dispatch({ type: 'SESSION_EXPIRED' });
				}
			} else {
				authDebugLog('No last activity found in localStorage');
			}
		};

		// Check session timeout every minute
		const interval = setInterval(checkSessionTimeout, 60000);

		return () => clearInterval(interval);
	}, [state.user, state.isInitialized, state.sessionTimeout, state.isLoading]);

	// Track user activity
	useEffect(() => {
		if (!state.user || state.isLoading) return;

		const activityEvents = [
			'mousedown',
			'mousemove',
			'keypress',
			'scroll',
			'touchstart',
			'click',
		];

		const handleActivity = () => {
			updateActivity();
		};

		// Add event listeners for user activity
		activityEvents.forEach((event) => {
			document.addEventListener(event, handleActivity, true);
		});

		return () => {
			// Remove event listeners
			activityEvents.forEach((event) => {
				document.removeEventListener(event, handleActivity, true);
			});
		};
	}, [state.user, updateActivity, state.isLoading]);

	// Computed values
	const isAuthenticated = state.user !== null;

	// Permission helper functions
	const hasPermission = useCallback(
		(permission: string): boolean => {
			if (!state.permissions || !state.user) return false;

			const [module, action] = permission.split('.');

			if (module === 'modules') {
				return (
					state.permissions.modules[
						action as keyof typeof state.permissions.modules
					] || false
				);
			}

			if (module === 'presales') {
				return (
					state.permissions.presales[
						action as keyof typeof state.permissions.presales
					] || false
				);
			}

			return false;
		},
		[state.permissions, state.user],
	);

	const isAdmin = state.user?.userType === 'admin';
	const isEmployee = state.user?.userType === 'employee';

	// Default empty permissions for when user is not authenticated
	const defaultPermissions: UserPermissions = {
		modules: {
			products: false,
			customers: false,
			reports: false,
			paymentMethods: false,
			userManagement: false,
		},
		presales: {
			canCreate: false,
			canViewOwn: false,
			canViewAll: false,
		},
	};

	// Context value
	const contextValue: AuthContextType = {
		user: state.user,
		isAuthenticated,
		isLoading: state.isLoading,
		error: state.error,
		login,
		logout,
		clearError,
		permissions: state.permissions || defaultPermissions,
		hasPermission,
		isAdmin,
		isEmployee,
	};

	// Show loading screen during initialization
	if (!state.isInitialized) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="flex flex-col items-center space-y-4">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
					<p className="text-gray-600">Carregando...</p>
				</div>
			</div>
		);
	}

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	);
};

export default AuthContext;
