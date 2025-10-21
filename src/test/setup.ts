import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom';

// Runs a cleanup after each test case
afterEach(() => {
	cleanup();
});

// Mock environment variables
beforeAll(() => {
	process.env.VITE_API_BASE_URL = 'http://localhost:3001/api';
	process.env.VITE_APP_NAME = 'Flow CRM Test';
});

// Global test utilities
export const mockApiResponse = <T>(data: T) => ({
	success: true,
	data,
	message: 'Success',
	timestamp: new Date().toISOString(),
});

export const mockErrorResponse = (message = 'Test error') => ({
	success: false,
	error: {
		code: 'TEST_ERROR',
		message,
	},
	timestamp: new Date().toISOString(),
});
