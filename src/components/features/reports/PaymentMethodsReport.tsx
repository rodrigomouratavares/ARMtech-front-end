import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { usePermissions } from '../../../hooks/usePermissions';
import {
	ReportsServiceError,
	reportsService,
} from '../../../services/reportsService';
import toastService from '../../../services/ToastService';
import type {
	PaymentMethodReportData,
	ReportError,
	ReportFilters as ReportFiltersType,
	ReportSummary as ReportSummaryType,
	TableColumn,
} from '../../../types';
import Button from '../../common/Button';
import Table from '../../common/Table';
import ReportFilters from './ReportFilters';
import ReportSummary from './ReportSummary';
import ReportsPermissionCheck from './ReportsPermissionCheck';

interface PaymentMethodsReportProps {
	className?: string;
}

interface PaymentMethodsReportState {
	reportData: PaymentMethodReportData[];
	summary: ReportSummaryType | null;
	isLoading: boolean;
	error: ReportError | null;
	filters: ReportFiltersType | null;
	lastUpdated: Date | null;
}

/**
 * PaymentMethodsReport - Main component for payment methods report
 * Integrates data fetching, filtering, and display components
 */
const PaymentMethodsReport: React.FC<PaymentMethodsReportProps> = React.memo(
	({ className = '' }) => {
		const permissions = usePermissions();

		// Check if user has permission to access reports
		const canAccessReports = permissions.canAccessReports();

		// If user doesn't have permission, show permission check component
		if (!canAccessReports) {
			return <ReportsPermissionCheck />;
		}

		const [state, setState] = useState<PaymentMethodsReportState>({
			reportData: [],
			summary: null,
			isLoading: true,
			error: null,
			filters: null,
			lastUpdated: null,
		});

		// Fetch report data based on filters
		const fetchReportData = useCallback(async (filters?: ReportFiltersType) => {
			try {
				// Validate filters before making request
				if (filters?.dateRange) {
					const { startDate, endDate } = filters.dateRange;
					if (startDate > endDate) {
						throw new Error('Data inicial deve ser anterior à data final');
					}

					const today = new Date();
					if (startDate > today || endDate > today) {
						throw new Error('As datas não podem ser no futuro');
					}
				}

				setState((prev) => ({
					...prev,
					isLoading: true,
					error: null,
				}));

				// Fetch both report data and summary in parallel
				const [reportData, summary] = await Promise.all([
					reportsService.getPaymentMethodsReport(filters),
					reportsService.getReportSummary(filters),
				]);

				// Sort report data by total amount (descending) - as per requirements
				const sortedReportData = reportData.sort(
					(a, b) => b.totalAmount - a.totalAmount,
				);

				setState((prev) => ({
					...prev,
					reportData: sortedReportData,
					summary,
					isLoading: false,
					filters: filters || null,
					lastUpdated: new Date(),
				}));

				// Show success toast for data loading (only if not initial load)
				if (filters) {
					toastService.success('Relatório atualizado com sucesso!');
				}
			} catch (error) {
				console.error('Error fetching report data:', error);

				let reportError: ReportError;

				// Handle validation errors from local validation
				if (error instanceof Error) {
					if (
						error.message.includes('Data inicial') ||
						error.message.includes('datas não podem')
					) {
						reportError = {
							message: error.message,
							code: 'INVALID_FILTERS',
						};
					} else if (error instanceof ReportsServiceError) {
						// Handle enhanced service errors
						reportError = {
							message: error.message,
							code: error.code,
							details: error.originalError?.message,
						};
					} else {
						// Generic error fallback
						reportError = {
							message:
								'Erro inesperado ao carregar relatório. Tente novamente.',
							code: 'NETWORK_ERROR',
							details: error.message,
						};
					}
				} else {
					reportError = {
						message: 'Erro desconhecido ao carregar relatório',
						code: 'NETWORK_ERROR',
					};
				}

				setState((prev) => ({
					...prev,
					isLoading: false,
					error: reportError,
				}));

				// Show toast notification for errors (except validation errors)
				if (
					reportError.code !== 'INVALID_FILTERS' &&
					reportError.code !== 'VALIDATION_ERROR'
				) {
					if (
						reportError.code === 'NETWORK_ERROR' ||
						reportError.code === 'TIMEOUT_ERROR'
					) {
						toastService.error('Erro de conexão. Verifique sua internet.');
					} else if (reportError.code === 'SERVER_ERROR') {
						toastService.error(
							'Erro no servidor. Tente novamente em alguns minutos.',
						);
					} else {
						toastService.error('Erro ao carregar relatório.');
					}
				}
			}
		}, []);

		// Load initial data on component mount
		useEffect(() => {
			// Set default filters (last 30 days)
			const defaultFilters: ReportFiltersType = {
				dateRange: {
					startDate: (() => {
						const date = new Date();
						date.setDate(date.getDate() - 30);
						return date;
					})(),
					endDate: new Date(),
				},
			};

			fetchReportData(defaultFilters);
		}, [fetchReportData]);

		// Handle filter changes from ReportFilters component
		const handleFiltersChange = useCallback(
			(filters: ReportFiltersType) => {
				// Clear any existing errors when filters change
				setState((prev) => ({
					...prev,
					error: null,
				}));

				fetchReportData(filters);
			},
			[fetchReportData],
		);

		// Handle filter reset
		const handleResetFilters = useCallback(() => {
			const defaultFilters: ReportFiltersType = {
				dateRange: {
					startDate: (() => {
						const date = new Date();
						date.setDate(date.getDate() - 30);
						return date;
					})(),
					endDate: new Date(),
				},
			};

			setState((prev) => ({
				...prev,
				error: null,
			}));

			fetchReportData(defaultFilters);
		}, [fetchReportData]);

		// Handle retry on error
		const handleRetry = useCallback(() => {
			toastService.info('Tentando carregar relatório novamente...');
			fetchReportData(state.filters || undefined);
		}, [fetchReportData, state.filters]);

		// Clear error state
		const handleClearError = useCallback(() => {
			setState((prev) => ({
				...prev,
				error: null,
			}));
		}, []);

		// Export data to CSV
		const handleExportCSV = useCallback(() => {
			if (state.reportData.length === 0) {
				return;
			}

			try {
				// Prepare CSV headers
				const headers = [
					'Finalizadora',
					'Código',
					'Total (R$)',
					'Quantidade de Vendas',
					'Pré-vendas Convertidas',
					'Valor Pré-vendas (R$)',
					'Percentual do Total (%)',
				];

				// Prepare CSV rows
				const rows = state.reportData.map((record) => [
					record.paymentMethod.description,
					record.paymentMethod.code,
					record.totalAmount.toFixed(2).replace('.', ','),
					record.salesCount.toString(),
					record.convertedPresalesCount.toString(),
					record.convertedPresalesAmount.toFixed(2).replace('.', ','),
					((record.totalAmount / (state.summary?.totalAmount || 1)) * 100)
						.toFixed(1)
						.replace('.', ','),
				]);

				// Create CSV content
				const csvContent = [
					headers.join(';'),
					...rows.map((row) => row.join(';')),
				].join('\n');

				// Add BOM for proper UTF-8 encoding in Excel
				const BOM = '\uFEFF';
				const csvWithBOM = BOM + csvContent;

				// Create and download file
				const blob = new Blob([csvWithBOM], {
					type: 'text/csv;charset=utf-8;',
				});
				const link = document.createElement('a');

				if (link.download !== undefined) {
					const url = URL.createObjectURL(blob);
					link.setAttribute('href', url);

					// Generate filename with current date and filter info
					const now = new Date();
					const dateStr = now.toISOString().split('T')[0];
					const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');

					let filename = `relatorio-formas-pagamento_${dateStr}_${timeStr}`;

					// Add period info to filename if available
					if (state.filters?.dateRange) {
						const startDate = state.filters.dateRange.startDate
							.toISOString()
							.split('T')[0];
						const endDate = state.filters.dateRange.endDate
							.toISOString()
							.split('T')[0];
						filename += `_periodo-${startDate}-a-${endDate}`;
					}

					filename += '.csv';

					link.setAttribute('download', filename);
					link.style.visibility = 'hidden';
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					URL.revokeObjectURL(url);

					// Show success toast
					toastService.success('Relatório exportado com sucesso!');
				}
			} catch (error) {
				console.error('Error exporting CSV:', error);
				toastService.error('Erro ao exportar relatório. Tente novamente.');
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [
			state.reportData,
			state.summary?.totalAmount,
			state.filters?.dateRange,
		]);

		// Export data to PDF
		const handleExportPDF = useCallback(() => {
			if (state.reportData.length === 0) {
				toastService.warning('Não há dados para exportar.');
				return;
			}

			// Temporarily disabled - PDF export functionality
			toastService.info(
				'Funcionalidade de exportação PDF temporariamente desabilitada',
			);
			return;

			/*
			try {
				// Create new PDF document
				const doc = new jsPDF();

				// Set document properties
				doc.setProperties({
					title: 'Relatório de Formas de Pagamento',
					subject: 'Relatório de Vendas por Forma de Pagamento',
					author: 'Sistema de Vendas',
					creator: 'Sistema de Vendas',
				});

				// Add title
				doc.setFontSize(18);
				doc.setFont('helvetica', 'bold');
				doc.text('Relatório de Formas de Pagamento', 14, 22);

				// Add period information
				let yPosition = 35;
				doc.setFontSize(12);
				doc.setFont('helvetica', 'normal');

				if (state.filters?.dateRange) {
					const startDate = new Intl.DateTimeFormat('pt-BR').format(
						state.filters.dateRange.startDate,
					);
					const endDate = new Intl.DateTimeFormat('pt-BR').format(
						state.filters.dateRange.endDate,
					);
					doc.text(`Período: ${startDate} - ${endDate}`, 14, yPosition);
					yPosition += 8;
				}

				// Add generation date
				const now = new Date();
				const generationDate = new Intl.DateTimeFormat('pt-BR', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
				}).format(now);
				doc.text(`Gerado em: ${generationDate}`, 14, yPosition);
				yPosition += 15;

				// Add summary information
				if (state.summary) {
					doc.setFontSize(14);
					doc.setFont('helvetica', 'bold');
					doc.text('Resumo', 14, yPosition);
					yPosition += 10;

					doc.setFontSize(11);
					doc.setFont('helvetica', 'normal');

					const totalFormatted = new Intl.NumberFormat('pt-BR', {
						style: 'currency',
						currency: 'BRL',
					}).format(state.summary.totalAmount);

					doc.text(`Total Geral: ${totalFormatted}`, 14, yPosition);
					yPosition += 6;

					doc.text(
						`Pré-vendas Convertidas: ${state.summary.totalConvertedPresales.toLocaleString('pt-BR')} vendas`,
						14,
						yPosition,
					);
					yPosition += 15;
				}

				// Prepare table data
				const tableHeaders = [
					'Finalizadora',
					'Código',
					'Total (R$)',
					'Vendas',
					'Pré-vendas',
					'Valor Pré-vendas (R$)',
					'% Total',
				];

				const tableData = state.reportData.map((record) => [
					record.paymentMethod.description,
					record.paymentMethod.code,
					record.totalAmount.toLocaleString('pt-BR', {
						style: 'currency',
						currency: 'BRL',
					}),
					record.salesCount.toString(),
					record.convertedPresalesCount.toString(),
					record.convertedPresalesAmount.toLocaleString('pt-BR', {
						style: 'currency',
						currency: 'BRL',
					}),
					`${((record.totalAmount / (state.summary?.totalAmount || 1)) * 100).toFixed(1)}%`,
				]);

				// Add table using autoTable plugin
				(doc as any).autoTable({
					head: [tableHeaders],
					body: tableData,
					startY: yPosition,
					styles: {
						fontSize: 9,
						cellPadding: 3,
					},
					headStyles: {
						fillColor: [59, 130, 246], // Blue color
						textColor: 255,
						fontStyle: 'bold',
					},
					alternateRowStyles: {
						fillColor: [248, 250, 252], // Light gray
					},
					columnStyles: {
						0: { cellWidth: 35 }, // Finalizadora
						1: { cellWidth: 20 }, // Código
						2: { cellWidth: 25, halign: 'right' }, // Total
						3: { cellWidth: 15, halign: 'center' }, // Vendas
						4: { cellWidth: 20, halign: 'center' }, // Pré-vendas
						5: { cellWidth: 25, halign: 'right' }, // Valor Pré-vendas
						6: { cellWidth: 15, halign: 'right' }, // % Total
					},
					margin: { left: 14, right: 14 },
					tableWidth: 'auto',
				});

				// Add footer with page numbers
				const pageCount = doc.getNumberOfPages();
				for (let i = 1; i <= pageCount; i++) {
					doc.setPage(i);
					doc.setFontSize(8);
					doc.setFont('helvetica', 'normal');
					doc.text(
						`Página ${i} de ${pageCount}`,
						doc.internal.pageSize.width - 30,
						doc.internal.pageSize.height - 10,
					);
				}

				// Generate filename
				const now2 = new Date();
				const dateStr = now2.toISOString().split('T')[0];
				const timeStr = now2.toTimeString().split(' ')[0].replace(/:/g, '-');

				let filename = `relatorio-formas-pagamento_${dateStr}_${timeStr}`;

				// Add period info to filename if available
				if (state.filters?.dateRange) {
					const startDate = state.filters.dateRange.startDate
						.toISOString()
						.split('T')[0];
					const endDate = state.filters.dateRange.endDate
						.toISOString()
						.split('T')[0];
					filename += `_periodo-${startDate}-a-${endDate}`;
				}

				filename += '.pdf';

				// Save the PDF
				doc.save(filename);
			} catch (error) {
				console.error('Error exporting PDF:', error);
				// You could show a toast notification here
			}
			*/
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [
			state.reportData,
			state.summary?.totalAmount,
			state.filters?.dateRange,
		]);

		// Memoized currency formatter for performance
		const formatCurrency = useMemo(() => {
			return (value: number): string => {
				return new Intl.NumberFormat('pt-BR', {
					style: 'currency',
					currency: 'BRL',
				}).format(value);
			};
		}, []);

		// Memoized table columns configuration with enhanced responsive design
		const columns: TableColumn<Record<string, unknown>>[] = useMemo(
			() => [
				{
					key: 'paymentMethod',
					title: 'Finalizadora',
					sortable: false, // Custom sorting will be handled separately
					render: (_: unknown, record: Record<string, unknown>) => {
						const typedRecord = record as unknown as PaymentMethodReportData;
						return (
							<div className="flex items-center min-w-0">
								<div className="flex-1 min-w-0">
									<div className="font-medium text-gray-900 truncate text-sm sm:text-base">
										{typedRecord.paymentMethod.description}
									</div>
									<div className="text-xs sm:text-sm text-gray-500 mt-1 space-y-1">
										<div className="flex flex-wrap gap-x-3 gap-y-1">
											<span className="inline-flex items-center">
												<svg
													className="w-3 h-3 mr-1 text-gray-400"
													fill="currentColor"
													viewBox="0 0 20 20"
													aria-label="Ícone de vendas"
												>
													<title>Ícone de vendas</title>
													<path
														fillRule="evenodd"
														d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
														clipRule="evenodd"
													/>
												</svg>
												{typedRecord.salesCount}{' '}
												{typedRecord.salesCount === 1 ? 'venda' : 'vendas'}
											</span>
											{typedRecord.convertedPresalesCount > 0 && (
												<span className="inline-flex items-center text-green-600">
													<svg
														className="w-3 h-3 mr-1"
														fill="currentColor"
														viewBox="0 0 20 20"
														aria-label="Ícone de pré-vendas convertidas"
													>
														<title>Ícone de pré-vendas convertidas</title>
														<path
															fillRule="evenodd"
															d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
															clipRule="evenodd"
														/>
													</svg>
													{typedRecord.convertedPresalesCount} da pré-venda
												</span>
											)}
										</div>
									</div>
									{/* Mobile-only: Show value on small screens */}
									<div className="mt-2 sm:hidden">
										<div className="text-base font-semibold text-gray-900 font-mono">
											{formatCurrency(typedRecord.totalAmount)}
										</div>
										{typedRecord.convertedPresalesAmount > 0 && (
											<div className="text-xs text-green-600 font-mono mt-1">
												{formatCurrency(typedRecord.convertedPresalesAmount)} da
												pré-venda
											</div>
										)}
										<div className="text-xs text-gray-500 mt-1">
											{(
												(typedRecord.totalAmount /
													(state.summary?.totalAmount || 1)) *
												100
											).toFixed(1)}
											% do total
										</div>
									</div>
								</div>
							</div>
						);
					},
				},
				{
					key: 'totalAmount',
					title: 'Valor',
					sortable: true,
					render: (_: unknown, record: Record<string, unknown>) => {
						const typedRecord = record as unknown as PaymentMethodReportData;
						return (
							<div className="text-right hidden sm:block">
								<div className="font-semibold text-gray-900 font-mono text-lg">
									{formatCurrency(typedRecord.totalAmount)}
								</div>
								{typedRecord.convertedPresalesAmount > 0 && (
									<div className="text-sm text-green-600 font-mono mt-1">
										{formatCurrency(typedRecord.convertedPresalesAmount)} da
										pré-venda
									</div>
								)}
								<div className="text-xs text-gray-500 mt-1">
									{(
										(typedRecord.totalAmount /
											(state.summary?.totalAmount || 1)) *
										100
									).toFixed(1)}
									% do total
								</div>
							</div>
						);
					},
				},
			],
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[formatCurrency, state.summary?.totalAmount],
		);

		// Render error state with enhanced error handling
		if (state.error) {
			const isNetworkError =
				state.error.code === 'NETWORK_ERROR' ||
				state.error.code === 'TIMEOUT_ERROR';
			const isValidationError =
				state.error.code === 'INVALID_FILTERS' ||
				state.error.code === 'VALIDATION_ERROR';
			const isServerError = state.error.code === 'SERVER_ERROR';

			return (
				<div
					className={`bg-white rounded-lg border ${
						isValidationError ? 'border-yellow-200' : 'border-red-200'
					} ${className}`}
				>
					<div className="p-6 text-center">
						<div
							className={`mb-4 ${
								isValidationError ? 'text-yellow-400' : 'text-red-400'
							}`}
						>
							{isValidationError ? (
								<svg
									className="mx-auto h-12 w-12"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-label="Ícone de aviso"
								>
									<title>Ícone de aviso</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1}
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
									/>
								</svg>
							) : isNetworkError ? (
								<svg
									className="mx-auto h-12 w-12"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-label="Ícone de conexão"
								>
									<title>Ícone de conexão</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1}
										d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
									/>
								</svg>
							) : (
								<svg
									className="mx-auto h-12 w-12"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-label="Ícone de erro do servidor"
								>
									<title>Ícone de erro do servidor</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1}
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
							)}
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							{isValidationError
								? 'Problema com os filtros'
								: isNetworkError
									? 'Problema de conexão'
									: isServerError
										? 'Erro no servidor'
										: 'Erro ao carregar relatório'}
						</h3>
						<p className="text-gray-600 mb-4">{state.error.message}</p>

						{/* Additional help text based on error type */}
						{isNetworkError && (
							<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
								<p className="text-sm text-blue-800">
									<strong>Dicas:</strong> Verifique sua conexão com a internet e
									tente novamente. Se o problema persistir, aguarde alguns
									minutos.
								</p>
							</div>
						)}

						{isValidationError && (
							<div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
								<p className="text-sm text-yellow-800">
									<strong>Dica:</strong> Verifique se as datas estão corretas e
									dentro do período permitido.
								</p>
							</div>
						)}

						{isServerError && (
							<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
								<p className="text-sm text-red-800">
									<strong>Problema temporário:</strong> Nossos servidores estão
									com dificuldades. Tente novamente em alguns minutos.
								</p>
							</div>
						)}

						<div className="flex items-center justify-center space-x-3">
							{!isValidationError && (
								<Button variant="primary" onClick={handleRetry}>
									{isNetworkError ? 'Tentar Novamente' : 'Recarregar'}
								</Button>
							)}
							<Button variant="secondary" onClick={handleClearError}>
								{isValidationError ? 'Ajustar Filtros' : 'Fechar'}
							</Button>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div className={`space-y-6 ${className}`}>
				{/* Report Filters */}
				<ReportFilters
					onFiltersChange={handleFiltersChange}
					isLoading={state.isLoading}
				/>

				{/* Active Filters Summary */}
				{state.filters && !state.isLoading && (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
							<div className="flex-1">
								<h4 className="text-sm font-medium text-blue-900 mb-2">
									Filtros Ativos:
								</h4>
								<div className="flex flex-wrap gap-2 text-sm">
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
										{new Intl.DateTimeFormat('pt-BR').format(
											state.filters.dateRange.startDate,
										)}{' '}
										-{' '}
										{new Intl.DateTimeFormat('pt-BR').format(
											state.filters.dateRange.endDate,
										)}
									</span>
									{state.filters.paymentMethodId && (
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
											Forma específica selecionada
										</span>
									)}
								</div>
							</div>
							<div className="mt-3 sm:mt-0">
								<Button
									variant="secondary"
									size="sm"
									onClick={handleResetFilters}
									disabled={state.isLoading}
								>
									Resetar Filtros
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* Report Summary */}
				{state.summary && (
					<ReportSummary
						totalAmount={state.summary.totalAmount}
						totalConvertedPresales={state.summary.totalConvertedPresales}
						period={state.summary.period}
						isLoading={state.isLoading}
					/>
				)}

				{/* Report Data Table */}
				<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
					<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
							<div className="flex-1 min-w-0">
								<h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
									Vendas por Forma de Pagamento
								</h3>
								<div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
									{state.lastUpdated && !state.isLoading && (
										<span className="truncate">
											<span className="hidden sm:inline">
												Última atualização:{' '}
											</span>
											<span className="sm:hidden">Atualizado: </span>
											{state.lastUpdated.toLocaleTimeString('pt-BR')}
										</span>
									)}
									{state.reportData.length > 0 && !state.isLoading && (
										<span className="flex-shrink-0">
											{state.reportData.length}{' '}
											{state.reportData.length === 1 ? 'forma' : 'formas'}
										</span>
									)}
								</div>
							</div>

							<div className="flex items-center space-x-3">
								{state.isLoading && (
									<div className="flex items-center text-xs sm:text-sm text-gray-500">
										<div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-500 mr-2" />
										<span className="hidden sm:inline">
											Carregando dados...
										</span>
										<span className="sm:hidden">Carregando...</span>
									</div>
								)}

								{/* Export Buttons */}
								{state.reportData.length > 0 && !state.isLoading && (
									<div className="flex items-center space-x-2">
										<Button
											variant="secondary"
											size="sm"
											onClick={handleExportCSV}
											className="flex items-center space-x-2"
										>
											<svg
												className="w-4 h-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												aria-label="Ícone de exportar CSV"
											>
												<title>Ícone de exportar CSV</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
											<span className="hidden sm:inline">CSV</span>
											<span className="sm:hidden">CSV</span>
										</Button>

										<Button
											variant="secondary"
											size="sm"
											onClick={handleExportPDF}
											className="flex items-center space-x-2"
										>
											<svg
												className="w-4 h-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												aria-label="Ícone de exportar PDF"
											>
												<title>Ícone de exportar PDF</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
												/>
											</svg>
											<span className="hidden sm:inline">PDF</span>
											<span className="sm:hidden">PDF</span>
										</Button>
									</div>
								)}
							</div>
						</div>
					</div>

					{state.reportData.length > 0 ? (
						<div className="overflow-hidden">
							<Table
								columns={columns}
								data={state.reportData as unknown as Record<string, unknown>[]}
								loading={state.isLoading}
								sortable={true}
								pagination={false} // Disable pagination for reports - show all data
							/>
						</div>
					) : (
						<div className="p-6">
							{!state.isLoading ? (
								<div className="text-center py-12">
									<div className="text-gray-400 mb-4">
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
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										Nenhuma venda encontrada
									</h3>
									<p className="text-gray-600 max-w-md mx-auto">
										Não há vendas para o período e filtros selecionados. Tente
										ajustar os filtros ou selecionar um período diferente.
									</p>

									{/* Helpful suggestions */}
									<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
										<h4 className="text-sm font-medium text-blue-900 mb-2">
											Sugestões:
										</h4>
										<ul className="text-sm text-blue-800 space-y-1 text-left">
											<li>• Amplie o período de datas</li>
											<li>• Remova o filtro de forma de pagamento</li>
											<li>• Verifique se há vendas cadastradas no sistema</li>
										</ul>
									</div>
								</div>
							) : (
								<div className="flex items-center justify-center py-12">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		);
	},
);

export default PaymentMethodsReport;
