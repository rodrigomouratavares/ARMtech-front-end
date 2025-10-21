// Mock service to simulate API calls for dashboard data

export interface DashboardMetrics {
	salesToday: {
		value: number;
		trend: { value: number; isPositive: boolean };
	};
	totalProducts: {
		value: number;
		trend: { value: number; isPositive: boolean };
	};
	activeCustomers: {
		value: number;
		trend: { value: number; isPositive: boolean };
	};
	lowStockProducts: {
		value: number;
		trend: { value: number; isPositive: boolean };
	};
	inventoryValue: {
		value: number;
		trend: { value: number; isPositive: boolean };
	};
	monthlyRevenue: {
		value: number;
		trend: { value: number; isPositive: boolean };
	};
}

export interface SalesData {
	date: string;
	sales: number;
	revenue: number;
}

export interface RecentActivity {
	id: string;
	type: 'sale' | 'product' | 'customer' | 'inventory';
	description: string;
	timestamp: Date;
}

export interface InventoryAlert {
	id: string;
	productName: string;
	currentStock: number;
	minimumStock: number;
	severity: 'low' | 'critical';
}

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock data generators
const generateSalesData = (): SalesData[] => {
	const data: SalesData[] = [];
	const today = new Date();

	for (let i = 6; i >= 0; i--) {
		const date = new Date(today);
		date.setDate(date.getDate() - i);

		data.push({
			date: date.toISOString().split('T')[0],
			sales: Math.floor(Math.random() * 20) + 5, // 5-25 sales per day
			revenue: Math.floor(Math.random() * 5000) + 1000, // R$ 1000-6000 per day
		});
	}

	return data;
};

const generateRecentActivities = (): RecentActivity[] => {
	const activities = [
		{
			type: 'sale' as const,
			descriptions: [
				'Nova venda realizada - Cliente: João Silva - R$ 450,00',
				'Venda finalizada - Cliente: Maria Santos - R$ 1.200,00',
				'Pedido processado - Cliente: Pedro Costa - R$ 780,00',
				'Venda concluída - Cliente: Ana Oliveira - R$ 320,00',
			],
		},
		{
			type: 'product' as const,
			descriptions: [
				'Produto "Notebook Dell" cadastrado no sistema',
				'Produto "Mouse Wireless" atualizado',
				'Novo produto "Teclado Mecânico" adicionado',
				'Produto "Monitor 24" removido do catálogo',
			],
		},
		{
			type: 'customer' as const,
			descriptions: [
				'Novo cliente cadastrado: Maria Santos',
				'Cliente "João Silva" atualizou dados',
				'Novo cliente cadastrado: Pedro Costa',
				'Cliente "Ana Oliveira" cadastrado',
			],
		},
		{
			type: 'inventory' as const,
			descriptions: [
				'Estoque baixo: Produto "Mouse Wireless" (5 unidades)',
				'Ajuste de estoque: Produto "Notebook Dell" (+10 unidades)',
				'Alerta crítico: Produto "Teclado USB" (2 unidades)',
				'Reposição realizada: Produto "Monitor 21" (+15 unidades)',
			],
		},
	];

	const result: RecentActivity[] = [];
	let id = 1;

	activities.forEach((category) => {
		category.descriptions.forEach((description) => {
			result.push({
				id: id.toString(),
				type: category.type,
				description,
				timestamp: new Date(Date.now() - id * 15 * 60 * 1000), // 15 minutes apart
			});
			id++;
		});
	});

	// Shuffle and take first 8
	return result.sort(() => Math.random() - 0.5).slice(0, 8);
};

const generateInventoryAlerts = (): InventoryAlert[] => {
	const products = [
		{ name: 'Mouse Wireless', current: 5, minimum: 10 },
		{ name: 'Teclado USB', current: 2, minimum: 8 },
		{ name: 'Cabo HDMI', current: 3, minimum: 15 },
		{ name: 'Adaptador USB-C', current: 1, minimum: 5 },
		{ name: 'Carregador Universal', current: 4, minimum: 12 },
	];

	return products.map((product, index) => ({
		id: (index + 1).toString(),
		productName: product.name,
		currentStock: product.current,
		minimumStock: product.minimum,
		severity: product.current <= 2 ? ('critical' as const) : ('low' as const),
	}));
};

// Mock API service
export class MockDashboardService {
	private static instance: MockDashboardService;
	private shouldSimulateError = false;
	private loadingDelay = 800; // ms

	static getInstance(): MockDashboardService {
		if (!MockDashboardService.instance) {
			MockDashboardService.instance = new MockDashboardService();
		}
		return MockDashboardService.instance;
	}

	// Method to simulate errors for testing
	setSimulateError(simulate: boolean) {
		this.shouldSimulateError = simulate;
	}

	setLoadingDelay(delay: number) {
		this.loadingDelay = delay;
	}

	async getDashboardMetrics(): Promise<DashboardMetrics> {
		await delay(this.loadingDelay);

		if (this.shouldSimulateError) {
			throw new Error('Falha ao carregar métricas do dashboard');
		}

		return {
			salesToday: {
				value: 12450,
				trend: { value: 12.5, isPositive: true },
			},
			totalProducts: {
				value: 1247,
				trend: { value: 3.2, isPositive: true },
			},
			activeCustomers: {
				value: 892,
				trend: { value: 8.1, isPositive: true },
			},
			lowStockProducts: {
				value: 23,
				trend: { value: 15.3, isPositive: false },
			},
			inventoryValue: {
				value: 145780,
				trend: { value: 5.7, isPositive: true },
			},
			monthlyRevenue: {
				value: 387650,
				trend: { value: 18.2, isPositive: true },
			},
		};
	}

	async getSalesData(): Promise<SalesData[]> {
		await delay(this.loadingDelay);

		if (this.shouldSimulateError) {
			throw new Error('Falha ao carregar dados de vendas');
		}

		return generateSalesData();
	}

	async getRecentActivities(): Promise<RecentActivity[]> {
		await delay(this.loadingDelay / 2); // Faster loading for activities

		if (this.shouldSimulateError) {
			throw new Error('Falha ao carregar atividades recentes');
		}

		return generateRecentActivities();
	}

	async getInventoryAlerts(): Promise<InventoryAlert[]> {
		await delay(this.loadingDelay);

		if (this.shouldSimulateError) {
			throw new Error('Falha ao carregar alertas de estoque');
		}

		return generateInventoryAlerts();
	}

	// Utility method to format currency
	static formatCurrency(value: number): string {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(value);
	}

	// Utility method to format numbers
	static formatNumber(value: number): string {
		return new Intl.NumberFormat('pt-BR').format(value);
	}
}

export const dashboardService = MockDashboardService.getInstance();
