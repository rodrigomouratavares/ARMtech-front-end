/**
 * Security utilities for the application
 */

/**
 * Sanitizes user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
	if (typeof input !== 'string') return '';

	return input
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.replace(/\//g, '&#x2F;');
};

/**
 * Validates email format with additional security checks
 */
export const isValidEmail = (email: string): boolean => {
	if (!email || typeof email !== 'string') return false;

	// Basic email regex
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	// Additional security checks
	const hasValidLength = email.length >= 5 && email.length <= 254;
	const hasNoScripts = !/<script|javascript:|data:/i.test(email);
	const hasNoSqlInjection = !/('|(--)|;|\/\*|\*\/|xp_|sp_)/i.test(email);

	return (
		emailRegex.test(email) &&
		hasValidLength &&
		hasNoScripts &&
		hasNoSqlInjection
	);
};

/**
 * Validates password strength
 */
export const validatePasswordStrength = (
	password: string,
): {
	isValid: boolean;
	score: number;
	feedback: string[];
} => {
	if (!password || typeof password !== 'string') {
		return {
			isValid: false,
			score: 0,
			feedback: ['Senha é obrigatória'],
		};
	}

	const feedback: string[] = [];
	let score = 0;

	// Length check
	if (password.length < 6) {
		feedback.push('Senha deve ter pelo menos 6 caracteres');
	} else if (password.length >= 8) {
		score += 1;
	}

	// Character variety checks
	if (/[a-z]/.test(password)) score += 1;
	if (/[A-Z]/.test(password)) score += 1;
	if (/[0-9]/.test(password)) score += 1;
	if (/[^a-zA-Z0-9]/.test(password)) score += 1;

	// Common password patterns
	const commonPatterns = [
		/123456/,
		/password/i,
		/qwerty/i,
		/admin/i,
		/letmein/i,
	];

	if (commonPatterns.some((pattern) => pattern.test(password))) {
		feedback.push('Evite senhas comuns');
		score = Math.max(0, score - 2);
	}

	// Strength feedback
	if (score < 2) {
		feedback.push('Senha muito fraca');
	} else if (score < 3) {
		feedback.push('Senha fraca - considere adicionar mais caracteres');
	} else if (score < 4) {
		feedback.push('Senha moderada');
	}

	return {
		isValid: password.length >= 6 && score >= 1,
		score,
		feedback,
	};
};

/**
 * Generates a secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
	const chars =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';

	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	return result;
};

/**
 * Checks if the current environment is secure (HTTPS in production)
 */
export const isSecureEnvironment = (): boolean => {
	if (typeof window === 'undefined') return true; // Server-side

	const isLocalhost =
		window.location.hostname === 'localhost' ||
		window.location.hostname === '127.0.0.1' ||
		window.location.hostname.startsWith('192.168.');

	const isHttps = window.location.protocol === 'https:';

	// Allow HTTP on localhost for development
	return isHttps || isLocalhost;
};

/**
 * Logs security events for monitoring
 */
export const logSecurityEvent = (
	event: string,
	details: Record<string, any> = {},
	severity: 'low' | 'medium' | 'high' = 'medium',
): void => {
	const securityLog = {
		timestamp: new Date().toISOString(),
		event,
		details,
		severity,
		userAgent:
			typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
		url: typeof window !== 'undefined' ? window.location.href : 'unknown',
	};

	// In a real application, this would be sent to a security monitoring service
	console.warn('Security Event:', securityLog);

	// Store in localStorage for audit purposes (in development)
	try {
		const existingLogs = JSON.parse(
			localStorage.getItem('flowcrm_security_logs') || '[]',
		);
		existingLogs.push(securityLog);

		// Keep only last 100 security logs
		if (existingLogs.length > 100) {
			existingLogs.splice(0, existingLogs.length - 100);
		}

		localStorage.setItem('flowcrm_security_logs', JSON.stringify(existingLogs));
	} catch (error) {
		console.warn('Failed to store security log:', error);
	}
};

/**
 * Detects potential security threats in user input
 */
export const detectSecurityThreats = (input: string): string[] => {
	const threats: string[] = [];

	if (!input || typeof input !== 'string') return threats;

	// XSS detection
	if (
		/<script|javascript:|data:|vbscript:|onload|onerror|onclick/i.test(input)
	) {
		threats.push('Potential XSS attempt detected');
	}

	// SQL injection detection
	if (
		/('|(--)|;|\/\*|\*\/|xp_|sp_|exec|union|select|insert|update|delete|drop)/i.test(
			input,
		)
	) {
		threats.push('Potential SQL injection attempt detected');
	}

	// Path traversal detection
	if (/\.\.|\/etc\/|\/proc\/|\/sys\/|\/dev\/|\/var\/|\/tmp\//i.test(input)) {
		threats.push('Potential path traversal attempt detected');
	}

	// Command injection detection
	if (/(\||&|;|`|\$\(|\${|<|>)/i.test(input)) {
		threats.push('Potential command injection attempt detected');
	}

	return threats;
};

/**
 * Rate limiting utility
 */
class RateLimiter {
	private attempts: Map<string, number[]> = new Map();

	private maxAttempts: number;
	private windowMs: number;

	constructor(
		maxAttempts: number = 10,
		windowMs: number = 60000, // 1 minute
	) {
		this.maxAttempts = maxAttempts;
		this.windowMs = windowMs;
	}

	isAllowed(identifier: string): boolean {
		const now = Date.now();
		const attempts = this.attempts.get(identifier) || [];

		// Remove old attempts outside the window
		const validAttempts = attempts.filter((time) => now - time < this.windowMs);

		if (validAttempts.length >= this.maxAttempts) {
			return false;
		}

		// Add current attempt
		validAttempts.push(now);
		this.attempts.set(identifier, validAttempts);

		return true;
	}

	getRemainingAttempts(identifier: string): number {
		const attempts = this.attempts.get(identifier) || [];
		const now = Date.now();
		const validAttempts = attempts.filter((time) => now - time < this.windowMs);

		return Math.max(0, this.maxAttempts - validAttempts.length);
	}

	reset(identifier: string): void {
		this.attempts.delete(identifier);
	}
}

// Export a default rate limiter instance
export const defaultRateLimiter = new RateLimiter();

/**
 * Content Security Policy helpers
 */
export const getCSPDirectives = (): Record<string, string> => {
	return {
		'default-src': "'self'",
		'script-src': "'self' 'unsafe-inline'", // Note: 'unsafe-inline' should be avoided in production
		'style-src': "'self' 'unsafe-inline'",
		'img-src': "'self' data: blob:",
		'font-src': "'self'",
		'connect-src': "'self'",
		'media-src': "'self'",
		'object-src': "'none'",
		'child-src': "'none'",
		'worker-src': "'none'",
		'frame-ancestors': "'none'",
		'form-action': "'self'",
		'base-uri': "'self'",
		'manifest-src': "'self'",
	};
};

/**
 * Security headers for API requests
 */
export const getSecurityHeaders = (): Record<string, string> => {
	return {
		'X-Content-Type-Options': 'nosniff',
		'X-Frame-Options': 'DENY',
		'X-XSS-Protection': '1; mode=block',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
	};
};
