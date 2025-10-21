import avatarPNG from '../assets/avatar.jpg';
import type { User } from '../types';

// Mock user data - this will be replaced with real authentication later
export const mockUser: User = {
	id: '1',
	name: 'John Doe',
	email: 'john.doe@empresa.com',
	password: 'admin123',
	userType: 'admin',
	permissions: {
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
	},
	isActive: true,
	avatar: avatarPNG,
	createdAt: new Date('2024-01-01T00:00:00Z'),
	updatedAt: new Date('2024-01-01T00:00:00Z'),
};

// Mock search handler - this will be replaced with real search functionality
export const handleSearch = (query: string) => {
	console.log('Search query:', query);
	// TODO: Implement search functionality
};
