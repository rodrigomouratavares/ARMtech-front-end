import {
	DollarSign,
	Package,
	RefreshCw,
	ShoppingCart,
	Users,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../hooks/useCustomers';
import { useDashboard } from '../../../hooks/useDashboard';
import { useProducts } from '../../../hooks/useProducts';
import { presaleService } from '../../../services/presaleService';
import toastService, { TOAST_MESSAGES } from '../../../services/ToastService';
import type { PreSale } from '../../../types';
import type { Customer } from '../../../types/api';
import { UnifiedPresaleModal } from '../shared/presaleModal';

// Type for metrics cards
interface MetricCardData {
	title: string;
	value: string;
	icon: React.ReactNode;
	trend: {
		value: number;
		isPositive: boolean;
		period?: string;
	};
	color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
}

import InventoryAlerts from './InventoryAlerts';
import MetricsCard from './MetricsCard';
import RecentActivities from './RecentActivities';
import SalesChart from './SalesChart';

interface DashboardProps {
	className?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
	const navigate = useNavigate();
	const { isAdmin, isEmployee, hasPermission, user } = useAuth();

	const [showPresaleModal, setShowPresaleModal] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Hook personalizado para dados do dashboard
	const {
		metrics,
		salesData,
		recentActivities,
		inventoryAlerts,
		loading,
		errors,
		refresh,
	} = useDashboard();

	// Carregar dados reais do banco de dados
	const {
		customers,
		error: customersError,
		fetchCustomers,
	} = useCustomers({ page: 1, limit: 100 }); // Carregar mais clientes para o modal

	const {
		products,
		error: productsError,
		fetchProducts,
	} = useProducts({ page: 1, limit: 100 }); // Carregar mais produtos para o modal

	const handleRefresh = async () => {
		setIsRefreshing(true);
		await Promise.all([
			refresh(),
			fetchCustomers({ page: 1, limit: 100 }),
			fetchProducts({ page: 1, limit: 100 }),
		]);
		setIsRefreshing(false);
	};

	// Mostrar erros se houver (apenas uma vez por erro)
	useEffect(() => {
		if (customersError) {
			console.error('Erro ao carregar clientes:', customersError);
		}
	}, [customersError]);

	useEffect(() => {
		if (productsError) {
			console.error('Erro ao carregar produtos:', productsError);
		}
	}, [productsError]);

	// Converter dados da API para o formato esperado pelo modal
	const convertCustomersForModal = (apiCustomers: Customer[] | undefined) => {
		if (!apiCustomers) return [];
		return apiCustomers.map((customer) => ({
			...customer,
			createdAt: new Date(customer.createdAt),
			updatedAt: new Date(customer.updatedAt),
		}));
	};

	// Criar cards de métricas baseados nos dados reais
	const metricsCards: MetricCardData[] = metrics
		? [
				{
					title: 'Vendas Hoje',
					value: new Intl.NumberFormat('pt-BR', {
						style: 'currency',
						currency: 'BRL',
					}).format(metrics.salesToday.value),
					icon: <ShoppingCart className="w-6 h-6" />,
					trend: metrics.salesToday.trend,
					color: 'green',
				},
				{
					title: 'Receita Mensal',
					value: new Intl.NumberFormat('pt-BR', {
						style: 'currency',
						currency: 'BRL',
					}).format(metrics.monthlyRevenue.value),
					icon: <DollarSign className="w-6 h-6" />,
					trend: metrics.monthlyRevenue.trend,
					color: 'blue',
				},
				{
					title: 'Total de Produtos',
					value: new Intl.NumberFormat('pt-BR').format(
						metrics.totalProducts.value,
					),
					icon: <Package className="w-6 h-6" />,
					trend: metrics.totalProducts.trend,
					color: 'purple',
				},
				{
					title: 'Clientes Ativos',
					value: new Intl.NumberFormat('pt-BR').format(
						metrics.activeCustomers.value,
					),
					icon: <Users className="w-6 h-6" />,
					trend: metrics.activeCustomers.trend,
					color: 'indigo',
				},
			]
		: [];

	const handleNewSale = () => {
		setShowPresaleModal(true);
	};

	const handleRegisterProduct = () => {
		navigate('/products');
	};

	const handleRegisterCustomer = () => {
		navigate('/customers');
	};

	const handlePresaleSubmit = async (
		presaleData: Omit<PreSale, 'id' | 'createdAt' | 'updatedAt'>,
	) => {
		try {
			// Converter dados do modal para o formato da API
			const apiPresaleData = {
				customerId: presaleData.customer.id,
				status: 'draft' as const,
				discount: presaleData.discount?.toString() || '0',
				discountType: presaleData.discountType || 'percentage',
				discountPercentage:
					presaleData.discountType === 'percentage'
						? presaleData.discount?.toString() || '0'
						: '0',
				notes: presaleData.notes || '',
				items: presaleData.items.map((item) => ({
					productId: item.product.id,
					quantity: item.quantity.toString(),
					unitPrice: item.unitPrice.toString(),
				})),
			};

			const response = await presaleService.create(apiPresaleData);

			if (response.success) {
				toastService.success(TOAST_MESSAGES.presale.created);
				// Redirect to presales page to see the created presale
				navigate('/presales');
			} else {
				toastService.error('Erro ao criar pré-venda: ' + response.message);
			}
		} catch (error) {
			console.error('Erro ao criar pré-venda:', error);
			toastService.error('Erro ao criar pré-venda. Tente novamente.');
		}
	};

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Page Header */}
			<div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="responsive-text-lg text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
					<p className="text-gray-600 mt-1 text-sm sm:text-base">
						{isAdmin
							? 'Visão geral completa do sistema de vendas'
							: `Painel de vendas - ${user?.name}`}
					</p>
					{isEmployee && (
						<p className="text-xs sm:text-sm text-blue-600 mt-1">
							Funcionário • Acesso limitado baseado em permissões
						</p>
					)}
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
					<button
						type="button"
						onClick={handleRefresh}
						disabled={isRefreshing}
						className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
					>
						<RefreshCw
							className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
						/>
						Atualizar
					</button>
					<p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
						Última atualização: {new Date().toLocaleString('pt-BR')}
					</p>
				</div>
			</div>

			{/* KPI Cards Grid */}
			<div className="metrics-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
				{metricsCards.map((card) => (
					<MetricsCard
						key={card.title}
						title={card.title}
						value={card.value}
						icon={card.icon}
						trend={card.trend}
						color={card.color}
						loading={loading.metrics}
						error={errors.metrics}
						className="metrics-card"
					/>
				))}
			</div>

			{/* Main Content Grid */}
			<div className="dashboard-grid grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
				{/* Sales Chart */}
				<div className="lg:col-span-2 order-2 lg:order-1">
					<SalesChart
						data={salesData}
						loading={loading.sales}
						error={errors.sales}
					/>
				</div>

				{/* Quick Actions */}
				<div className="order-1 lg:order-2">
					<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
						<div className="responsive-p-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
							<h2 className="responsive-text-base text-base sm:text-lg font-semibold text-gray-900">
								Ações Rápidas
							</h2>
							{isEmployee && (
								<p className="text-xs sm:text-sm text-gray-500 mt-1">
									Ações disponíveis para {user?.name}
								</p>
							)}
						</div>
						<div className="responsive-p-2 p-4 sm:p-6 space-y-3">
							{/* Nova Venda - Available for all authenticated users */}
							<button
								type="button"
								onClick={handleNewSale}
								className="w-full flex items-center justify-center cursor-pointer px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
							>
								<ShoppingCart className="w-4 h-4 mr-2" />
								Nova Venda
							</button>

							{/* Cadastrar Produto - Only if user has products permission */}
							{(isAdmin || hasPermission('modules.products')) && (
								<button
									type="button"
									onClick={handleRegisterProduct}
									className="w-full flex items-center cursor-pointer justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
								>
									<Package className="w-4 h-4 mr-2" />
									Cadastrar Produto
								</button>
							)}

							{/* Cadastrar Cliente - Only if user has customers permission */}
							{(isAdmin || hasPermission('modules.customers')) && (
								<button
									type="button"
									onClick={handleRegisterCustomer}
									className="w-full flex items-center cursor-pointer justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
								>
									<Users className="w-4 h-4 mr-2" />
									Cadastrar Cliente
								</button>
							)}

							{/* Show message if employee has no additional permissions */}
							{isEmployee &&
								!hasPermission('modules.products') &&
								!hasPermission('modules.customers') && (
									<div className="text-center py-4">
										<p className="text-xs sm:text-sm text-gray-500">
											Suas permissões atuais permitem apenas criar vendas.
										</p>
										<p className="text-xs text-gray-400 mt-1">
											Entre em contato com o administrador para solicitar acesso
											adicional.
										</p>
									</div>
								)}
						</div>
					</div>
				</div>
			</div>

			{/* Additional Dashboard Widgets */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* Recent Activities */}
				<RecentActivities
					activities={recentActivities}
					loading={loading.activities}
					error={errors.activities}
				/>

				{/* Inventory Alerts */}
				<InventoryAlerts
					alerts={inventoryAlerts}
					loading={loading.alerts}
					error={errors.alerts}
				/>
			</div>

			{/* Modal para Nova Pré-venda */}
			{customers && products && (
				<UnifiedPresaleModal
					isOpen={showPresaleModal}
					onClose={() => setShowPresaleModal(false)}
					onSubmit={handlePresaleSubmit}
					customers={convertCustomersForModal(customers)}
					products={
						(products || []).map((p) => ({
							...p,
							purchasePrice: Number(p.purchasePrice),
							salePrice: Number(p.salePrice),
							createdAt: new Date(p.createdAt),
							updatedAt: new Date(p.updatedAt),
						})) as any
					}
					title="Nova Pré-venda"
				/>
			)}
		</div>
	);
};

export default Dashboard;
