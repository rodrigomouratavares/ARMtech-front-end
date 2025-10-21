import { BarChart3 } from 'lucide-react';
import type React from 'react';

interface SalesData {
	date: string;
	sales: number;
	revenue: number;
}

interface SalesChartProps {
	data: SalesData[];
	loading?: boolean;
	error?: string;
	title?: string;
}

const SalesChart: React.FC<SalesChartProps> = ({
	data,
	loading = false,
	error,
	title = 'Vendas dos Últimos 7 Dias',
}) => {
	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
				<div className="px-6 py-4 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
				</div>
				<div className="p-6">
					<div className="animate-pulse">
						<div className="flex items-end space-x-2 h-32">
							{[...Array(7)].map((_, i) => (
								<div
									key={i}
									className="flex-1 bg-gray-200 rounded"
									style={{ height: `${Math.random() * 80 + 20}%` }}
								></div>
							))}
						</div>
						<div className="flex justify-between mt-4">
							{[...Array(7)].map((_, i) => (
								<div key={i} className="h-4 bg-gray-200 rounded w-8"></div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
				<div className="px-6 py-4 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
				</div>
				<div className="p-6">
					<div className="text-center py-8">
						<BarChart3 className="w-12 h-12 text-red-400 mx-auto mb-4" />
						<p className="text-red-600 font-medium">Erro ao carregar gráfico</p>
						<p className="text-sm text-gray-500 mt-1">{error}</p>
					</div>
				</div>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
				<div className="px-6 py-4 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
				</div>
				<div className="p-6">
					<div className="text-center py-8">
						<BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
						<p className="text-gray-500">Nenhum dado disponível</p>
					</div>
				</div>
			</div>
		);
	}

	const maxRevenue = Math.max(...data.map((d) => d.revenue));
	const maxSales = Math.max(...data.map((d) => d.sales));

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(value);
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
		});
	};

	return (
		<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
			<div className="px-6 py-4 border-b border-gray-200">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
					<div className="flex items-center space-x-4 text-sm">
						<div className="flex items-center">
							<div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
							<span className="text-gray-600">Receita</span>
						</div>
						<div className="flex items-center">
							<div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
							<span className="text-gray-600">Vendas</span>
						</div>
					</div>
				</div>
			</div>
			<div className="p-6">
				{/* Simple bar chart */}
				<div className="relative">
					<div className="flex items-end space-x-2 h-40 mb-4">
						{data.map((item, index) => {
							const revenueHeight = (item.revenue / maxRevenue) * 100;
							const salesHeight = (item.sales / maxSales) * 80; // Slightly smaller scale for visibility

							return (
								<div
									key={index}
									className="flex-1 flex flex-col items-center space-y-1"
								>
									{/* Revenue bar */}
									<div className="w-full flex justify-center">
										<div
											className="bg-blue-500 rounded-t w-3/4 min-h-[4px] relative group cursor-pointer"
											style={{ height: `${Math.max(revenueHeight, 4)}%` }}
											title={`Receita: ${formatCurrency(item.revenue)}`}
										>
											<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
												{formatCurrency(item.revenue)}
											</div>
										</div>
									</div>
									{/* Sales bar */}
									<div className="w-full flex justify-center">
										<div
											className="bg-green-500 rounded-t w-3/4 min-h-[4px] relative group cursor-pointer"
											style={{ height: `${Math.max(salesHeight, 4)}%` }}
											title={`Vendas: ${item.sales}`}
										>
											<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
												{item.sales} vendas
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{/* X-axis labels */}
					<div className="flex justify-between text-xs text-gray-500">
						{data.map((item, index) => (
							<span key={index} className="flex-1 text-center">
								{formatDate(item.date)}
							</span>
						))}
					</div>
				</div>

				{/* Summary */}
				<div className="mt-6 pt-4 border-t border-gray-200">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p className="text-gray-600">Total de Vendas</p>
							<p className="font-semibold text-gray-900">
								{data.reduce((sum, item) => sum + item.sales, 0)} vendas
							</p>
						</div>
						<div>
							<p className="text-gray-600">Receita Total</p>
							<p className="font-semibold text-gray-900">
								{formatCurrency(
									data.reduce((sum, item) => sum + item.revenue, 0),
								)}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SalesChart;
