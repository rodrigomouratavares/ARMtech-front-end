import React, { useMemo } from 'react';

interface DateRange {
	startDate: Date;
	endDate: Date;
}

interface ReportSummaryProps {
	totalAmount: number;
	totalConvertedPresales: number;
	period: DateRange;
	isLoading?: boolean;
	className?: string;
}

/**
 * ReportSummary - Component for displaying report summary information
 * Shows total amount, converted presales count, and selected period
 */
const ReportSummary: React.FC<ReportSummaryProps> = React.memo(
	({
		totalAmount,
		totalConvertedPresales,
		period,
		isLoading = false,
		className = '',
	}) => {
		// Memoized formatters for performance
		const formatCurrency = useMemo(() => {
			return (value: number): string => {
				return new Intl.NumberFormat('pt-BR', {
					style: 'currency',
					currency: 'BRL',
				}).format(value);
			};
		}, []);

		const formatDate = useMemo(() => {
			return (date: Date): string => {
				return new Intl.DateTimeFormat('pt-BR', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
				}).format(date);
			};
		}, []);

		// Memoized calculations
		const { formattedPeriod, periodDuration } = useMemo(() => {
			const formatPeriod = (startDate: Date, endDate: Date): string => {
				// Validate dates before formatting
				if (
					!startDate ||
					!endDate ||
					isNaN(startDate.getTime()) ||
					isNaN(endDate.getTime())
				) {
					return 'Período inválido';
				}

				const start = formatDate(startDate);
				const end = formatDate(endDate);

				// If same date, show only one date
				if (start === end) {
					return start;
				}

				return `${start} - ${end}`;
			};

			const getPeriodDuration = (startDate: Date, endDate: Date): number => {
				// Validate dates before calculating duration
				if (
					!startDate ||
					!endDate ||
					isNaN(startDate.getTime()) ||
					isNaN(endDate.getTime())
				) {
					return 1; // Default to 1 day if dates are invalid
				}

				const timeDiff = endDate.getTime() - startDate.getTime();
				return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
			};

			// Ensure period dates are valid Date objects
			const startDate =
				period.startDate instanceof Date
					? period.startDate
					: new Date(period.startDate);
			const endDate =
				period.endDate instanceof Date
					? period.endDate
					: new Date(period.endDate);

			return {
				formattedPeriod: formatPeriod(startDate, endDate),
				periodDuration: getPeriodDuration(startDate, endDate),
			};
		}, [period.startDate, period.endDate, formatDate]);

		return (
			<div
				className={`bg-white rounded-lg border border-gray-200 ${className}`}
			>
				{/* Header with period */}
				<div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold text-gray-900">
								Resumo do Relatório
							</h2>
							<p className="text-sm text-gray-600 mt-1">
								Período: {formattedPeriod}
								{periodDuration > 1 && (
									<span className="ml-2 text-gray-500">
										({periodDuration} dias)
									</span>
								)}
							</p>
						</div>

						{isLoading && (
							<div className="flex items-center text-sm text-gray-500">
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2" />
								Atualizando...
							</div>
						)}
					</div>
				</div>

				{/* Summary metrics */}
				<div className="p-4 sm:p-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
						{/* Total Amount Card */}
						<div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4 border border-blue-200">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center">
										<svg
											className="w-4 h-4 sm:w-5 sm:h-5 text-white"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											aria-label="Ícone de dinheiro"
										>
											<title>Ícone de dinheiro</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
											/>
										</svg>
									</div>
								</div>
								<div className="ml-3 sm:ml-4 flex-1 min-w-0">
									<div className="text-xs sm:text-sm font-medium text-blue-800">
										Total Geral
									</div>
									<div className="text-lg sm:text-2xl font-bold text-blue-900 truncate">
										{isLoading ? (
											<div className="animate-pulse bg-blue-200 h-6 sm:h-8 w-24 sm:w-32 rounded" />
										) : (
											formatCurrency(totalAmount)
										)}
									</div>
									{!isLoading && periodDuration > 1 && (
										<div className="text-xs text-blue-600 mt-1 truncate">
											Média diária:{' '}
											{formatCurrency(totalAmount / periodDuration)}
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Converted Presales Card */}
						<div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 sm:p-4 border border-green-200">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg flex items-center justify-center">
										<svg
											className="w-4 h-4 sm:w-5 sm:h-5 text-white"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											aria-label="Ícone de conversão"
										>
											<title>Ícone de conversão</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</div>
								</div>
								<div className="ml-3 sm:ml-4 flex-1 min-w-0">
									<div className="text-xs sm:text-sm font-medium text-green-800">
										Pré-vendas Convertidas
									</div>
									<div className="text-lg sm:text-2xl font-bold text-green-900">
										{isLoading ? (
											<div className="animate-pulse bg-green-200 h-6 sm:h-8 w-16 sm:w-20 rounded" />
										) : (
											<>
												<span className="truncate">
													{totalConvertedPresales.toLocaleString('pt-BR')}
												</span>
												<span className="text-sm sm:text-lg font-normal text-green-700 ml-1">
													{totalConvertedPresales === 1 ? 'venda' : 'vendas'}
												</span>
											</>
										)}
									</div>
									{!isLoading && periodDuration > 1 && (
										<div className="text-xs text-green-600 mt-1 truncate">
											Média diária:{' '}
											{(totalConvertedPresales / periodDuration).toFixed(1)}{' '}
											vendas
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Additional insights */}
					{!isLoading && totalConvertedPresales > 0 && totalAmount > 0 && (
						<div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
							<h4 className="text-sm font-medium text-gray-900 mb-3">
								Insights do Período
							</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
								<div className="bg-white p-3 rounded border">
									<span className="text-gray-600 text-xs sm:text-sm block">
										Ticket médio por venda:
									</span>
									<div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
										{formatCurrency(
											totalAmount / Math.max(totalConvertedPresales, 1),
										)}
									</div>
								</div>

								{periodDuration > 7 && (
									<div className="bg-white p-3 rounded border">
										<span className="text-gray-600 text-xs sm:text-sm block">
											Vendas por semana:
										</span>
										<div className="font-semibold text-gray-900 text-sm sm:text-base">
											{((totalConvertedPresales / periodDuration) * 7).toFixed(
												1,
											)}{' '}
											vendas
										</div>
									</div>
								)}

								{periodDuration >= 30 && (
									<div className="bg-white p-3 rounded border sm:col-span-2 lg:col-span-1">
										<span className="text-gray-600 text-xs sm:text-sm block">
											Projeção mensal:
										</span>
										<div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
											{formatCurrency((totalAmount / periodDuration) * 30)}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Empty state */}
					{!isLoading && totalAmount === 0 && totalConvertedPresales === 0 && (
						<div className="mt-6 text-center py-8">
							<div className="text-gray-400 mb-2">
								<svg
									className="mx-auto h-12 w-12"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-label="Ícone de dados vazios"
								>
									<title>Ícone de dados vazios</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1}
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							</div>
							<h3 className="text-lg font-medium text-gray-900 mb-1">
								Nenhuma venda encontrada
							</h3>
							<p className="text-gray-600">
								Não há dados para o período selecionado. Tente ajustar os
								filtros.
							</p>
						</div>
					)}
				</div>
			</div>
		);
	},
);

export default ReportSummary;
