import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '../authService';
import { httpClient } from '../httpClient';

// Mock httpClient
vi.mock('../httpClient', () => ({
	httpClient: {
		post: vi.fn(),
		get: vi.fn(),
		setAuthTokens: vi.fn(),
		clearAuthTokens: vi.fn(),
	},
}));

describe('AuthService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('login', () => {
		it('should login successfully', async () => {
			const mockResponse = {
				token: 'test-token',
				refreshToken: 'refresh-token',
				user: {
					id: '1',
					email: 'test@example.com',
					name: 'Test User',
					role: 'employee' as const,
				},
				expiresIn: 3600,
			};

			vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

			const result = await authService.login({
				email: 'test@example.com',
				password: 'password',
			});

			expect(result).toEqual(mockResponse);
			expect(httpClient.post).toHaveBeenCalledWith('/auth/login', {
				email: 'test@example.com',
				password: 'password',
			});
		});
	});

	describe('logout', () => {
		it('should logout successfully', async () => {
			vi.mocked(httpClient.post).mockResolvedValue(null);

			await authService.logout();

			expect(httpClient.post).toHaveBeenCalledWith('/auth/logout');
		});
	});
});
