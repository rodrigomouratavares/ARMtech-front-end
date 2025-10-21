import type { PaymentMethod } from '../types';

// Mock data for payment methods - centralized source
const mockPaymentMethods: PaymentMethod[] = [
	{
		id: '1',
		code: 'PAG001',
		description: 'Dinheiro',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: '2',
		code: 'PAG002',
		description: 'Cartão de Crédito',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: '3',
		code: 'PAG003',
		description: 'PIX',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: '4',
		code: 'PAG004',
		description: 'Cartão de Débito',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: '5',
		code: 'PAG005',
		description: 'Boleto Bancário',
		isActive: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
];

// Mock service for payment methods
export const mockPaymentMethodService = {
	// Get all payment methods
	getAll: async (): Promise<PaymentMethod[]> => {
		return Promise.resolve([...mockPaymentMethods]);
	},

	// Get payment method by ID
	getById: async (id: string): Promise<PaymentMethod | null> => {
		const paymentMethod = mockPaymentMethods.find((pm) => pm.id === id);
		return Promise.resolve(paymentMethod || null);
	},

	// Create new payment method
	create: async (
		data: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>,
	): Promise<PaymentMethod> => {
		const newPaymentMethod: PaymentMethod = {
			id: Date.now().toString(),
			...data,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		mockPaymentMethods.push(newPaymentMethod);
		return Promise.resolve(newPaymentMethod);
	},

	// Update payment method
	update: async (
		id: string,
		data: Partial<Omit<PaymentMethod, 'id' | 'createdAt'>>,
	): Promise<PaymentMethod | null> => {
		const index = mockPaymentMethods.findIndex((pm) => pm.id === id);
		if (index === -1) {
			return Promise.resolve(null);
		}

		mockPaymentMethods[index] = {
			...mockPaymentMethods[index],
			...data,
			updatedAt: new Date(),
		};

		return Promise.resolve(mockPaymentMethods[index]);
	},

	// Delete payment method
	delete: async (id: string): Promise<boolean> => {
		const index = mockPaymentMethods.findIndex((pm) => pm.id === id);
		if (index === -1) {
			return Promise.resolve(false);
		}

		mockPaymentMethods.splice(index, 1);
		return Promise.resolve(true);
	},
};
