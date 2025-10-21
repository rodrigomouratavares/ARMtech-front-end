import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { paymentMethodService } from '../../../services/paymentMethodService';
import type {
	PaymentMethod,
	ReportFilters as ReportFiltersType,
} from '../../../types';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select, { type SelectOption } from '../../common/Select';

interface ReportFiltersProps {
	onFiltersChange: (filters: ReportFiltersType) => void;
	isLoading?: boolean;
	className?: string;
}

interface ReportFiltersState {
	startDate: string;
	endDate: string;
	paymentMethodId: string;
	paymentMethods: PaymentMethod[];
	isLoadingPaymentMethods: boolean;
	errors: {
		startDate?: string;
		endDate?: string;
		paymentMethod?: string;
	};
}

/**
 * ReportFilters - Component for filtering reports by date range and payment method
 * Includes validation and debounced updates
 */
const ReportFilters: React.FC<ReportFiltersProps> = React.memo(
	({ onFiltersChange, isLoading = false, className = '' }) => {
		const [state, setState] = useState<ReportFiltersState>({
			startDate: '',
			endDate: '',
			paymentMethodId: '',
			paymentMethods: [],
			isLoadingPaymentMethods: true,
			errors: {},
		});

		// Initialize with default date range (last 30 days)
		useEffect(() => {
			const today = new Date();
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(today.getDate() - 30);

			const formatDate = (date: Date) => {
				return date.toISOString().split('T')[0];
			};

			setState((prev) => ({
				...prev,
				startDate: formatDate(thirtyDaysAgo),
				endDate: formatDate(today),
			}));
		}, []);

		// Load payment methods
		useEffect(() => {
			const loadPaymentMethods = async () => {
				try {
					setState((prev) => ({ ...prev, isLoadingPaymentMethods: true }));
					const paymentMethods = await paymentMethodService.getAll();
					// Filter only active payment methods
					const activePaymentMethods = paymentMethods.filter(
						(pm) => pm.isActive,
					);
					setState((prev) => ({
						...prev,
						paymentMethods: activePaymentMethods,
						isLoadingPaymentMethods: false,
					}));
				} catch (error) {
					console.error('Failed to load payment methods:', error);
					setState((prev) => ({
						...prev,
						isLoadingPaymentMethods: false,
						errors: {
							...prev.errors,
							paymentMethod: 'Erro ao carregar formas de pagamento',
						},
					}));
				}
			};

			loadPaymentMethods();
		}, []);

		// Validate date range
		const validateDates = useCallback((startDate: string, endDate: string) => {
			const errors: ReportFiltersState['errors'] = {};

			if (!startDate) {
				errors.startDate = 'Data inicial é obrigatória';
			}

			if (!endDate) {
				errors.endDate = 'Data final é obrigatória';
			}

			if (startDate && endDate) {
				const start = new Date(startDate);
				const end = new Date(endDate);

				if (start > end) {
					errors.endDate = 'Data final deve ser maior ou igual à data inicial';
				}

				// Check if date range is not too far in the future
				const today = new Date();
				if (start > today) {
					errors.startDate = 'Data inicial não pode ser no futuro';
				}

				if (end > today) {
					errors.endDate = 'Data final não pode ser no futuro';
				}

				// Check if date range is reasonable (not more than 1 year)
				const oneYearAgo = new Date();
				oneYearAgo.setFullYear(today.getFullYear() - 1);

				if (start < oneYearAgo) {
					errors.startDate = 'Data inicial não pode ser anterior a 1 ano';
				}
			}

			return errors;
		}, []);

		// Debounced filter application
		useEffect(() => {
			const timeoutId = setTimeout(() => {
				if (state.startDate && state.endDate) {
					const errors = validateDates(state.startDate, state.endDate);

					setState((prev) => ({ ...prev, errors }));

					// Only apply filters if there are no validation errors
					if (Object.keys(errors).length === 0) {
						const filters: ReportFiltersType = {
							dateRange: {
								startDate: new Date(state.startDate),
								endDate: new Date(state.endDate),
							},
							paymentMethodId: state.paymentMethodId || undefined,
						};

						onFiltersChange(filters);
					}
				}
			}, 500); // 500ms debounce

			return () => clearTimeout(timeoutId);
		}, [
			state.startDate,
			state.endDate,
			state.paymentMethodId,
			onFiltersChange,
			validateDates,
		]);

		// Handle start date change
		const handleStartDateChange = (value: string) => {
			setState((prev) => ({
				...prev,
				startDate: value,
				errors: { ...prev.errors, startDate: undefined },
			}));
		};

		// Handle end date change
		const handleEndDateChange = (value: string) => {
			setState((prev) => ({
				...prev,
				endDate: value,
				errors: { ...prev.errors, endDate: undefined },
			}));
		};

		// Handle payment method change
		const handlePaymentMethodChange = (value: string) => {
			setState((prev) => ({
				...prev,
				paymentMethodId: value,
				errors: { ...prev.errors, paymentMethod: undefined },
			}));
		};

		// Reset filters to default
		const handleResetFilters = () => {
			const today = new Date();
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(today.getDate() - 30);

			const formatDate = (date: Date) => {
				return date.toISOString().split('T')[0];
			};

			setState((prev) => ({
				...prev,
				startDate: formatDate(thirtyDaysAgo),
				endDate: formatDate(today),
				paymentMethodId: '',
				errors: {},
			}));
		};

		// Apply filters immediately (bypass debounce)
		const handleApplyFilters = () => {
			if (state.startDate && state.endDate) {
				const errors = validateDates(state.startDate, state.endDate);

				setState((prev) => ({ ...prev, errors }));

				if (Object.keys(errors).length === 0) {
					const filters: ReportFiltersType = {
						dateRange: {
							startDate: new Date(state.startDate),
							endDate: new Date(state.endDate),
						},
						paymentMethodId: state.paymentMethodId || undefined,
					};

					onFiltersChange(filters);
				}
			}
		};

		// Memoized payment method options for select
		const paymentMethodOptions: SelectOption[] = useMemo(
			() => [
				{ value: '', label: 'Todas as formas de pagamento' },
				...state.paymentMethods.map((pm) => ({
					value: pm.id,
					label: pm.description,
				})),
			],
			[state.paymentMethods],
		);

		// Memoized validation state
		const { hasValidationErrors, canApplyFilters } = useMemo(() => {
			const hasErrors = Object.keys(state.errors).length > 0;
			const canApply = state.startDate && state.endDate && !hasErrors;
			return {
				hasValidationErrors: hasErrors,
				canApplyFilters: canApply,
			};
		}, [state.errors, state.startDate, state.endDate]);

		return (
			<div
				className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
			>
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-medium text-gray-900">Filtros</h3>
					<Button
						variant="secondary"
						size="sm"
						onClick={handleResetFilters}
						disabled={isLoading}
					>
						Limpar Filtros
					</Button>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* Start Date */}
					<div className="space-y-1">
						<Input
							type="date"
							label="Data Inicial"
							value={state.startDate}
							onChange={handleStartDateChange}
							error={state.errors.startDate}
							required
							disabled={isLoading}
						/>
					</div>

					{/* End Date */}
					<div className="space-y-1">
						<Input
							type="date"
							label="Data Final"
							value={state.endDate}
							onChange={handleEndDateChange}
							error={state.errors.endDate}
							required
							disabled={isLoading}
						/>
					</div>

					{/* Payment Method Filter */}
					<div className="space-y-1 sm:col-span-2 lg:col-span-1">
						<Select
							label="Forma de Pagamento"
							value={state.paymentMethodId}
							onChange={handlePaymentMethodChange}
							options={paymentMethodOptions}
							placeholder="Selecione uma forma de pagamento"
							error={state.errors.paymentMethod}
							disabled={isLoading || state.isLoadingPaymentMethods}
						/>
					</div>
				</div>

				{/* Filter Actions */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 pt-4 border-t border-gray-200 space-y-3 sm:space-y-0">
					<div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
						{state.isLoadingPaymentMethods && (
							<div className="flex items-center text-sm text-gray-500">
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2" />
								<span className="hidden sm:inline">
									Carregando formas de pagamento...
								</span>
								<span className="sm:hidden">Carregando...</span>
							</div>
						)}

						{hasValidationErrors && (
							<div className="text-sm text-red-600">
								<span className="hidden sm:inline">
									Corrija os erros antes de aplicar os filtros
								</span>
								<span className="sm:hidden">Corrija os erros nos campos</span>
							</div>
						)}
					</div>

					<div className="flex items-center space-x-3">
						<Button
							variant="primary"
							onClick={handleApplyFilters}
							disabled={!canApplyFilters || isLoading}
							loading={isLoading}
							className="flex-1 sm:flex-none"
						>
							<span className="hidden sm:inline">Aplicar Filtros</span>
							<span className="sm:hidden">Aplicar</span>
						</Button>
					</div>
				</div>

				{/* Filter Summary */}
				{canApplyFilters && (
					<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
						<div className="text-sm text-blue-800">
							<span className="font-medium">Período:</span> {state.startDate}{' '}
							até {state.endDate}
							{state.paymentMethodId && (
								<>
									{' • '}
									<span className="font-medium">Forma de Pagamento:</span>{' '}
									{
										paymentMethodOptions.find(
											(opt) => opt.value === state.paymentMethodId,
										)?.label
									}
								</>
							)}
						</div>
					</div>
				)}
			</div>
		);
	},
);

export default ReportFilters;
