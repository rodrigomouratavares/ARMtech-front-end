import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAuthToken } from '../useAuthToken';

// Mock localStorage
const mockLocalStorage = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
	value: mockLocalStorage,
});

describe('useAuthToken', () => {
	it('should return null when no token exists', () => {
		mockLocalStorage.getItem.mockReturnValue(null);

		const { result } = renderHook(() => useAuthToken());

		expect(result.current.token).toBeNull();
	});

	it('should return token when it exists', () => {
		const mockToken = 'test-token';
		mockLocalStorage.getItem.mockReturnValue(mockToken);

		const { result } = renderHook(() => useAuthToken());

		expect(result.current.token).toBe(mockToken);
	});
});
