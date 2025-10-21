// Utility functions for the sales management system

export const formatCurrency = (value: number): string => {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value);
};

export const formatCPF = (cpf: string): string => {
	// Check if cpf is valid before processing
	if (!cpf || typeof cpf !== 'string') {
		return '';
	}

	const cleaned = cpf.replace(/\D/g, '');
	const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
	if (match) {
		return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
	}
	return cpf;
};

export const validateCPF = (cpf: string): boolean => {
	// Check if cpf is valid before processing
	if (!cpf || typeof cpf !== 'string') {
		return false;
	}

	const cleaned = cpf.replace(/\D/g, '');
	if (cleaned.length !== 11) return false;

	// Check for known invalid CPFs
	if (/^(\d)\1{10}$/.test(cleaned)) return false;

	// Validate check digits
	let sum = 0;
	for (let i = 0; i < 9; i++) {
		sum += parseInt(cleaned.charAt(i), 10) * (10 - i);
	}
	let remainder = (sum * 10) % 11;
	if (remainder === 10 || remainder === 11) remainder = 0;
	if (remainder !== parseInt(cleaned.charAt(9), 10)) return false;

	sum = 0;
	for (let i = 0; i < 10; i++) {
		sum += parseInt(cleaned.charAt(i), 10) * (11 - i);
	}
	remainder = (sum * 10) % 11;
	if (remainder === 10 || remainder === 11) remainder = 0;
	if (remainder !== parseInt(cleaned.charAt(10), 10)) return false;

	return true;
};

export const validateEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export const generateId = (): string => {
	return Math.random().toString(36).substr(2, 9);
};

export const generateProductCode = (): string => {
	const timestamp = Date.now().toString().slice(-6);
	const random = Math.random().toString(36).substr(2, 3).toUpperCase();
	return `PRD${timestamp}${random}`;
};

// Export new services
export { default as AutoCodeService } from './autoCodeService';

// Export error handling utilities
export * from './errorHandling';

// Export validation utilities
export * from './validationUtils';
