// Environment Configuration with validation and fallbacks

export interface EnvironmentConfig {
	// API Configuration
	apiBaseUrl: string;
	apiTimeout: number;

	// Authentication Configuration
	tokenStorageKey: string;
	refreshTokenStorageKey: string;
	tokenRefreshThreshold: number;

	// Application Configuration
	appName: string;
	appVersion: string;
	appEnvironment: 'development' | 'staging' | 'production';

	// Debug Configuration
	debugApiCalls: boolean;
	debugAuth: boolean;

	// Feature Flags
	enableMockData: boolean;
	enableOfflineMode: boolean;

	// Security Configuration
	enableCsrfProtection: boolean;
	secureCookies: boolean;
}

// Default configuration values
const DEFAULT_CONFIG: EnvironmentConfig = {
	apiBaseUrl: 'http://localhost:3000/api',
	apiTimeout: 15000,
	tokenStorageKey: 'flowcrm_token',
	refreshTokenStorageKey: 'flowcrm_refresh_token',
	tokenRefreshThreshold: 300000, // 5 minutes
	appName: 'Flow CRM',
	appVersion: '1.0.0',
	appEnvironment: 'development',
	debugApiCalls: true,
	debugAuth: true,
	enableMockData: false,
	enableOfflineMode: false,
	enableCsrfProtection: true,
	secureCookies: false,
};

// Environment variable getters with validation
function getEnvString(key: string, defaultValue: string): string {
	const value = import.meta.env[key];
	return typeof value === 'string' && value.length > 0 ? value : defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
	const value = import.meta.env[key];
	const parsed = Number(value);
	return !Number.isNaN(parsed) && parsed > 0 ? parsed : defaultValue;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
	const value = import.meta.env[key];
	if (typeof value === 'string') {
		return value.toLowerCase() === 'true';
	}
	return defaultValue;
}

function getEnvEnvironment(
	key: string,
	defaultValue: EnvironmentConfig['appEnvironment'],
): EnvironmentConfig['appEnvironment'] {
	const value = import.meta.env[key];
	if (
		value === 'development' ||
		value === 'staging' ||
		value === 'production'
	) {
		return value;
	}
	return defaultValue;
}

// Validate API URL format
function validateApiUrl(url: string): string {
	// Allow empty URL for development (using proxy)
	if (!url || url.trim() === '') {
		return '';
	}

	try {
		const parsed = new URL(url);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			console.warn(
				`Invalid API URL protocol: ${parsed.protocol}. Using default.`,
			);
			return DEFAULT_CONFIG.apiBaseUrl;
		}
		return url;
	} catch {
		console.warn(`Invalid API URL format: ${url}. Using default.`);
		return DEFAULT_CONFIG.apiBaseUrl;
	}
}

// Create and validate configuration
function createConfig(): EnvironmentConfig {
	const config: EnvironmentConfig = {
		apiBaseUrl: validateApiUrl(
			getEnvString('VITE_API_BASE_URL', DEFAULT_CONFIG.apiBaseUrl),
		),
		apiTimeout: getEnvNumber('VITE_API_TIMEOUT', DEFAULT_CONFIG.apiTimeout),
		tokenStorageKey: getEnvString(
			'VITE_TOKEN_STORAGE_KEY',
			DEFAULT_CONFIG.tokenStorageKey,
		),
		refreshTokenStorageKey: getEnvString(
			'VITE_REFRESH_TOKEN_STORAGE_KEY',
			DEFAULT_CONFIG.refreshTokenStorageKey,
		),
		tokenRefreshThreshold: getEnvNumber(
			'VITE_TOKEN_REFRESH_THRESHOLD',
			DEFAULT_CONFIG.tokenRefreshThreshold,
		),
		appName: getEnvString('VITE_APP_NAME', DEFAULT_CONFIG.appName),
		appVersion: getEnvString('VITE_APP_VERSION', DEFAULT_CONFIG.appVersion),
		appEnvironment: getEnvEnvironment(
			'VITE_APP_ENVIRONMENT',
			DEFAULT_CONFIG.appEnvironment,
		),
		debugApiCalls: getEnvBoolean(
			'VITE_DEBUG_API_CALLS',
			DEFAULT_CONFIG.debugApiCalls,
		),
		debugAuth: getEnvBoolean('VITE_DEBUG_AUTH', DEFAULT_CONFIG.debugAuth),
		enableMockData: getEnvBoolean(
			'VITE_ENABLE_MOCK_DATA',
			DEFAULT_CONFIG.enableMockData,
		),
		enableOfflineMode: getEnvBoolean(
			'VITE_ENABLE_OFFLINE_MODE',
			DEFAULT_CONFIG.enableOfflineMode,
		),
		enableCsrfProtection: getEnvBoolean(
			'VITE_ENABLE_CSRF_PROTECTION',
			DEFAULT_CONFIG.enableCsrfProtection,
		),
		secureCookies: getEnvBoolean(
			'VITE_SECURE_COOKIES',
			DEFAULT_CONFIG.secureCookies,
		),
	};

	// Log configuration in development and production for debugging
	console.log('Environment Configuration:', {
		...config,
		// Don't log sensitive keys
		tokenStorageKey: '[REDACTED]',
		refreshTokenStorageKey: '[REDACTED]',
	});

	console.log('Raw environment variables:', {
		VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
		VITE_APP_ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT,
		MODE: import.meta.env.MODE,
		PROD: import.meta.env.PROD,
		DEV: import.meta.env.DEV,
	});

	return config;
}

// Validate required configuration
function validateConfig(config: EnvironmentConfig): void {
	const errors: string[] = [];

	// Allow empty API base URL in development (using proxy)
	if (!config.apiBaseUrl && config.appEnvironment !== 'development') {
		errors.push('API base URL is required');
	}

	if (config.apiTimeout < 1000) {
		errors.push('API timeout must be at least 1000ms');
	}

	if (config.tokenRefreshThreshold < 60000) {
		errors.push('Token refresh threshold must be at least 60000ms (1 minute)');
	}

	if (!config.tokenStorageKey || !config.refreshTokenStorageKey) {
		errors.push('Token storage keys are required');
	}

	if (errors.length > 0) {
		throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
	}
}

// Export the validated configuration
export const config = (() => {
	try {
		const cfg = createConfig();
		validateConfig(cfg);
		return cfg;
	} catch (error) {
		console.error('Failed to load configuration:', error);
		// Return default config as fallback
		return DEFAULT_CONFIG;
	}
})();

// Utility functions for common configuration checks
export const isProduction = () => config.appEnvironment === 'production';
export const isDevelopment = () => config.appEnvironment === 'development';
export const isStaging = () => config.appEnvironment === 'staging';

// API URL builders
export const buildApiUrl = (endpoint: string): string => {
	// If no base URL (using proxy), return endpoint as-is
	if (!config.apiBaseUrl) {
		return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
	}

	const baseUrl = config.apiBaseUrl.endsWith('/')
		? config.apiBaseUrl.slice(0, -1)
		: config.apiBaseUrl;
	const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
	return `${baseUrl}${cleanEndpoint}`;
};

// Debug logging utility
export const debugLog = (message: string, data?: unknown): void => {
	if (config.debugApiCalls && (isDevelopment() || isStaging())) {
		console.log(`[Flow CRM Debug] ${message}`, data || '');
	}
};

// Auth debug logging utility
export const authDebugLog = (message: string, data?: unknown): void => {
	if (config.debugAuth && (isDevelopment() || isStaging())) {
		console.log(`[Flow CRM Auth] ${message}`, data || '');
	}
};

export default config;
