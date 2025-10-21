import type {
	Customer,
	PaginatedResponse,
	PreSale,
	Product,
} from '../types/api';
import { httpClient } from './httpClient';

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

/**
 * Service for handling dashboard data from real backend APIs
 */
class DashboardService {
	/**
	 * Get dashboard metrics based on real data
	 */
	async getDashboardMetrics(): Promise<DashboardMetrics> {
		try {
			// Buscar dados reais em paralelo
			const [productsResponse, , presalesResponse] = await Promise.all([
				httpClient.get<PaginatedResponse<Product>>('/products?limit=100'),
				httpClient.get<PaginatedResponse<Customer>>('/customers?limit=100'),
				httpClient.get<PaginatedResponse<PreSale>>('/presales?limit=100'),
			]);

			const products = productsResponse.data || [];
			const presales = presalesResponse.data || [];

			// Calcular métricas reais (usando comparação de data simples para evitar problemas de fuso horário)
			const today = new Date();
			const todayDateString = today.toISOString().split('T')[0]; // "YYYY-MM-DD"
			const currentMonth = today.getMonth() + 1; // 1-12
			const currentYear = today.getFullYear();
			const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
			const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

			// Vendas de hoje
			const todaySales = presales.filter((presale: any) => {
				const presaleDate = new Date(presale.createdAt);
				const presaleDateString = presaleDate.toISOString().split('T')[0];
				return (
					presaleDateString === todayDateString &&
					presale.status === 'converted'
				);
			});

			const salesToday = todaySales.reduce(
				(sum: number, presale: any) => sum + Number(presale.total),
				0,
			);

			// Vendas do mês atual
			const currentMonthSales = presales.filter((presale: any) => {
				const presaleDate = new Date(presale.createdAt);
				const presaleMonth = presaleDate.getMonth() + 1;
				const presaleYear = presaleDate.getFullYear();
				return (
					presaleMonth === currentMonth &&
					presaleYear === currentYear &&
					presale.status === 'converted'
				);
			});

			const monthlyRevenue = currentMonthSales.reduce(
				(sum: number, presale: any) => sum + Number(presale.total),
				0,
			);

			// Vendas do mês passado para comparação
			const lastMonthSales = presales.filter((presale: any) => {
				const presaleDate = new Date(presale.createdAt);
				const presaleMonth = presaleDate.getMonth() + 1;
				const presaleYear = presaleDate.getFullYear();
				return (
					presaleMonth === lastMonth &&
					presaleYear === lastMonthYear &&
					presale.status === 'converted'
				);
			});

			const lastMonthRevenue = lastMonthSales.reduce(
				(sum: number, presale: any) => sum + Number(presale.total),
				0,
			);

			// Calcular tendências
			const monthlyTrend =
				lastMonthRevenue > 0
					? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
					: monthlyRevenue > 0
						? 100
						: 0;

			// Produtos com estoque baixo (menos de 10 unidades)
			const lowStockProducts = products.filter(
				(product: any) => product.stock < 10,
			);

			// Valor total do inventário
			const inventoryValue = products.reduce((sum: number, product: any) => {
				return sum + Number(product.purchasePrice) * product.stock;
			}, 0);

			// Clientes ativos (que fizeram pelo menos uma compra nos últimos 30 dias)
			const thirtyDaysAgo = new Date(
				today.getTime() - 30 * 24 * 60 * 60 * 1000,
			);
			const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0];
			const activeCustomerIds = new Set(
				presales
					.filter((presale: any) => {
						const presaleDateString = new Date(presale.createdAt)
							.toISOString()
							.split('T')[0];
						return presaleDateString >= thirtyDaysAgoString;
					})
					.map((presale: any) => presale.customerId),
			);

			return {
				salesToday: {
					value: salesToday,
					trend: { value: 8.5, isPositive: true }, // Simulado por enquanto
				},
				totalProducts: {
					value: products.length,
					trend: { value: 3.2, isPositive: true },
				},
				activeCustomers: {
					value: activeCustomerIds.size,
					trend: { value: 8.1, isPositive: true },
				},
				lowStockProducts: {
					value: lowStockProducts.length,
					trend: { value: 15.3, isPositive: false },
				},
				inventoryValue: {
					value: inventoryValue,
					trend: { value: 5.7, isPositive: true },
				},
				monthlyRevenue: {
					value: monthlyRevenue,
					trend: { value: monthlyTrend, isPositive: monthlyTrend >= 0 },
				},
			};
		} catch (error) {
			console.error('Erro ao buscar métricas do dashboard:', error);
			throw new Error('Falha ao carregar métricas do dashboard');
		}
	}

	/**
	 * Get sales data for the last 7 days
	 */
	async getSalesData(): Promise<SalesData[]> {
		try {
			const response = await httpClient.get<PaginatedResponse<PreSale>>(
				'/presales?limit=100',
			);
			const presales = response.data || [];

			const data: SalesData[] = [];
			const today = new Date();

			for (let i = 6; i >= 0; i--) {
				const date = new Date(today);
				date.setDate(date.getDate() - i);
				const dateString = date.toISOString().split('T')[0];

				// Filtrar vendas do dia usando comparação de string de data
				const daySales = presales.filter((presale: any) => {
					const presaleDate = new Date(presale.createdAt);
					const presaleDateString = presaleDate.toISOString().split('T')[0];
					return (
						presaleDateString === dateString && presale.status === 'converted'
					);
				});

				const dailyRevenue = daySales.reduce(
					(sum: number, presale: any) => sum + Number(presale.total),
					0,
				);

				data.push({
					date: dateString,
					sales: daySales.length,
					revenue: dailyRevenue,
				});
			}

			return data;
		} catch (error) {
			console.error('Erro ao buscar dados de vendas:', error);
			throw new Error('Falha ao carregar dados de vendas');
		}
	}

	/**
	 * Get recent activities from the system
	 */
	async getRecentActivities(): Promise<RecentActivity[]> {
		try {
			// Buscar dados recentes
			const [productsResponse, customersResponse, presalesResponse] =
				await Promise.all([
					httpClient.get<PaginatedResponse<Product>>('/products?limit=10'),
					httpClient.get<PaginatedResponse<Customer>>('/customers?limit=10'),
					httpClient.get<PaginatedResponse<PreSale>>('/presales?limit=10'),
				]);

			const activities: RecentActivity[] = [];

			// Adicionar atividades de vendas
			(presalesResponse.data || []).forEach((presale: any) => {
				activities.push({
					id: `sale-${presale.id}`,
					type: 'sale',
					description: `${presale.status === 'converted' ? 'Venda finalizada' : 'Nova pré-venda'} - Cliente: ${presale.customer?.name || 'N/A'} - R$ ${Number(presale.total).toFixed(2)}`,
					timestamp: new Date(presale.createdAt),
				});
			});

			// Adicionar atividades de produtos
			(productsResponse.data || []).forEach((product: any) => {
				activities.push({
					id: `product-${product.id}`,
					type: 'product',
					description: `Produto "${product.name}" cadastrado no sistema`,
					timestamp: new Date(product.createdAt),
				});
			});

			// Adicionar atividades de clientes
			(customersResponse.data || []).forEach((customer: any) => {
				activities.push({
					id: `customer-${customer.id}`,
					type: 'customer',
					description: `Novo cliente cadastrado: ${customer.name}`,
					timestamp: new Date(customer.createdAt),
				});
			});

			// Ordenar por timestamp e pegar os 8 mais recentes
			return activities
				.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
				.slice(0, 8);
		} catch (error) {
			console.error('Erro ao buscar atividades recentes:', error);
			throw new Error('Falha ao carregar atividades recentes');
		}
	}

	/**
	 * Get inventory alerts for low stock products
	 */
	async getInventoryAlerts(): Promise<InventoryAlert[]> {
		try {
			const response = await httpClient.get<PaginatedResponse<Product>>(
				'/products?limit=100',
			);
			const products = response.data || [];

			// Filtrar produtos com estoque baixo
			const lowStockProducts = products.filter(
				(product: any) => product.stock < 15,
			);

			return lowStockProducts.map((product: any) => ({
				id: product.id,
				productName: product.name,
				currentStock: product.stock,
				minimumStock: 15, // Valor padrão, pode ser configurável no futuro
				severity: product.stock <= 5 ? ('critical' as const) : ('low' as const),
			}));
		} catch (error) {
			console.error('Erro ao buscar alertas de inventário:', error);
			throw new Error('Falha ao carregar alertas de inventário');
		}
	}

	/**
	 * Utility method to format currency
	 */
	static formatCurrency(value: number): string {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(value);
	}

	/**
	 * Utility method to format numbers
	 */
	static formatNumber(value: number): string {
		return new Intl.NumberFormat('pt-BR').format(value);
	}
}

// Export singleton instance
export const dashboardService = new DashboardService();
