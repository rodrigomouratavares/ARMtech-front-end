/**
 * Validation utilities for user forms and data
 */

import {
	detectSecurityThreats,
	sanitizeInput,
	isValidEmail as secureIsValidEmail,
	validatePasswordStrength,
} from './securityUtils';

export interface ValidationResult {
	isValid: boolean;
	errors: Record<string, string>;
	securityThreats?: string[];
}

export interface UserFormData {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
	userType: 'admin' | 'employee';
	isActive: boolean;
}

/**
 * Validates email format with security checks
 */
export const isValidEmail = (email: string): boolean => {
	return secureIsValidEmail(email);
};

/**
 * Validates password strength with security requirements
 */
export const isValidPassword = (password: string): boolean => {
	const validation = validatePasswordStrength(password);
	return validation.isValid;
};

/**
 * Gets detailed password validation feedback
 */
export const getPasswordValidation = (password: string) => {
	return validatePasswordStrength(password);
};

/**
 * Validates user name
 */
export const isValidName = (name: string): boolean => {
	const trimmedName = name.trim();
	return trimmedName.length >= 2 && trimmedName.length <= 100;
};

/**
 * Comprehensive user form validation with security checks
 */
export const validateUserForm = (
	formData: UserFormData,
	isEditing: boolean = false,
	existingEmails: string[] = [],
): ValidationResult => {
	const errors: Record<string, string> = {};
	const securityThreats: string[] = [];

	// Security validation for all string inputs
	const stringFields = ['name', 'email', 'password'];
	for (const field of stringFields) {
		const value = formData[field as keyof UserFormData];
		if (typeof value === 'string' && value) {
			const threats = detectSecurityThreats(value);
			if (threats.length > 0) {
				errors[field] = 'Entrada contém conteúdo potencialmente perigoso';
				securityThreats.push(...threats);
			}
		}
	}

	// If security threats detected, return early
	if (securityThreats.length > 0) {
		return {
			isValid: false,
			errors,
			securityThreats,
		};
	}

	// Name validation
	if (!formData.name.trim()) {
		errors.name = 'Nome é obrigatório';
	} else if (!isValidName(formData.name)) {
		errors.name = 'Nome deve ter entre 2 e 100 caracteres';
	}

	// Email validation
	if (!formData.email.trim()) {
		errors.email = 'Email é obrigatório';
	} else if (!isValidEmail(formData.email)) {
		errors.email = 'Email inválido';
	} else if (existingEmails.includes(formData.email.toLowerCase().trim())) {
		errors.email = 'Este email já está em uso';
	}

	// Password validation (required for new users, optional for editing)
	const passwordRequired = !isEditing || formData.password.trim() !== '';

	if (passwordRequired) {
		if (!formData.password) {
			errors.password = 'Senha é obrigatória';
		} else {
			const passwordValidation = getPasswordValidation(formData.password);
			if (!passwordValidation.isValid) {
				errors.password = passwordValidation.feedback.join(', ');
			}
		}

		// Confirm password validation
		if (formData.password !== formData.confirmPassword) {
			errors.confirmPassword = 'Senhas não coincidem';
		}
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
		securityThreats,
	};
};

/**
 * Validates individual field
 */
export const validateField = (
	fieldName: string,
	value: string | boolean,
	formData: UserFormData,
	isEditing: boolean = false,
	existingEmails: string[] = [],
): string => {
	switch (fieldName) {
		case 'name':
			if (!String(value).trim()) return 'Nome é obrigatório';
			if (!isValidName(String(value)))
				return 'Nome deve ter entre 2 e 100 caracteres';
			break;

		case 'email':
			if (!String(value).trim()) return 'Email é obrigatório';
			if (!isValidEmail(String(value))) return 'Email inválido';
			if (existingEmails.includes(String(value).toLowerCase().trim())) {
				return 'Este email já está em uso';
			}
			break;

		case 'password': {
			const passwordRequired = !isEditing || String(value).trim() !== '';
			if (passwordRequired) {
				if (!String(value)) return 'Senha é obrigatória';
				if (!isValidPassword(String(value)))
					return 'Senha deve ter pelo menos 6 caracteres';
			}
			break;
		}

		case 'confirmPassword':
			if (formData.password !== String(value)) return 'Senhas não coincidem';
			break;
	}

	return '';
};

/**
 * Sanitizes user input with security measures
 * For URLs, we don't apply HTML entity encoding to preserve functionality
 */
export const sanitizeUserInput = (
	input: string,
	isUrl: boolean = false,
): string => {
	const trimmed = input.trim().replace(/\s+/g, ' ');

	// For URLs, don't apply HTML entity encoding as it breaks the URL
	if (isUrl) {
		return trimmed;
	}

	return sanitizeInput(trimmed);
};

/**
 * Formats email for storage (lowercase, trimmed)
 */
export const formatEmail = (email: string): string => {
	return email.toLowerCase().trim();
};
