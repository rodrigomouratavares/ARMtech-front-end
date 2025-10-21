import {
	History,
	Minus,
	Package,
	Plus,
	RefreshCw,
	Search,
	X,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import inventoryService, {
	type StockAdjustment as ApiStockAdjustment,
	type InventoryError,
	type StockAdjustmentRequest,
} from '../../../services/inventoryService';
import toastService, { TOAST_MESSAGES } from '../../../services/ToastService';
import type { Product } from '../../../types';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';

type TabType = 'adjustment' | 'history';

const InventoryPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<TabType>('adjustment');
	const [products, setProducts] = useState<Product[]>([]);
	const [adjustments, setAdjustments] = useState<ApiStockAdjustment[]>([]);
	const [isLoadingProducts, setIsLoadingProducts] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSearchingProduct, setIsSearchingProduct] = useState(false);

	// History pagination and filtering state
	const [historyPagination, setHistoryPagination] = useState({
		page: 1,
		limit: 12,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false,
	});
	const [historyFilters, setHistoryFilters] = useState({
		productCode: '',
		adjustmentType: '' as '' | 'add' | 'remove',
		startDate: '',
		endDate: '',
	});

	const [formData, setFormData] = useState({
		productCode: '',
		quantity: '',
		adjustmentType: 'add' as 'add' | 'remove',
		reason: '',
	});

	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [showProductSearch, setShowProductSearch] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
	const [sortBy, setSortBy] = useState<'name' | 'code' | 'stock'>('name');
	const [filterByStock, setFilterByStock] = useState<
		'all' | 'in_stock' | 'low_stock'
	>('all');

	// Store timeout IDs for debouncing validation
	const [validationTimeouts, setValidationTimeouts] = useState<{
		[key: string]: NodeJS.Timeout;
	}>({});

	// Network and retry state
	const [isOnline, setIsOnline] = useState(navigator.onLine);
	const [retryAttempts, setRetryAttempts] = useState<{ [key: string]: number }>(
		{},
	);
	const [lastFailedOperation, setLastFailedOperation] = useState<{
		type: 'search' | 'adjust' | 'history';
		data?: any;
		timestamp: number;
	} | null>(null);

	// Reload history when filters change
	useEffect(() => {
		if (activeTab === 'history') {
			const timeoutId = setTimeout(() => {
				loadStockHistory(1, true);
			}, 500); // Debounce filter changes

			return () => clearTimeout(timeoutId);
		}
	}, [historyFilters, activeTab]);

	// Retry logic for failed operations
	const retryLastFailedOperation = async () => {
		if (!lastFailedOperation || !isOnline) return;

		const { type, data } = lastFailedOperation;

		try {
			switch (type) {
				case 'search':
					if (data?.query !== undefined) {
						await debouncedSearchProducts(data.query);
					}
					break;
				case 'adjust':
					// Don't retry stock adjustments to prevent duplicate operations
					toastService.warning(
						'Ajuste de estoque não pode ser repetido automaticamente. Verifique o estoque atual e tente novamente se necessário.',
					);
					break;
				case 'history':
					await loadStockHistory(data?.page || 1, data?.resetData || true);
					break;
			}

			// Clear the failed operation after successful retry
			setLastFailedOperation(null);
			setRetryAttempts({});
		} catch (error) {
			console.error('Retry failed:', error);
		}
	};

	const executeWithRetry = async <T,>(
		operation: () => Promise<T>,
		operationType: 'search' | 'adjust' | 'history',
		operationData?: any,
		maxRetries: number = 3,
	): Promise<T> => {
		const operationKey = `${operationType}_${Date.now()}`;
		let currentAttempt = retryAttempts[operationKey] || 0;

		try {
			const result = await operation();

			// Clear retry attempts on success
			if (retryAttempts[operationKey]) {
				setRetryAttempts((prev) => {
					const newAttempts = { ...prev };
					delete newAttempts[operationKey];
					return newAttempts;
				});
			}

			return result;
		} catch (error) {
			const inventoryError = error as InventoryError;

			// Don't retry on validation errors or client errors (4xx)
			if (
				inventoryError.code === 'VALIDATION_ERROR' ||
				inventoryError.code === 'UNAUTHORIZED' ||
				inventoryError.code === 'NOT_FOUND'
			) {
				throw error;
			}

			// Check if we should retry (but never retry stock adjustments)
			const shouldRetry =
				operationType !== 'adjust' &&
				currentAttempt < maxRetries &&
				(inventoryError.code === 'NETWORK_ERROR' ||
					inventoryError.code === 'SERVER_ERROR');

			if (shouldRetry) {
				currentAttempt++;
				setRetryAttempts((prev) => ({
					...prev,
					[operationKey]: currentAttempt,
				}));

				// Store failed operation for potential retry after reconnection (except adjustments)
				if (operationType === 'search' || operationType === 'history') {
					setLastFailedOperation({
						type: operationType,
						data: operationData,
						timestamp: Date.now(),
					});
				}

				// Show retry notification
				toastService.info(
					`${TOAST_MESSAGES.inventory.retrying} (Tentativa ${currentAttempt}/${maxRetries})`,
					{
						autoClose: 2000,
					},
				);

				// Exponential backoff delay
				const delay = Math.min(1000 * 2 ** (currentAttempt - 1), 10000);
				await new Promise((resolve) => setTimeout(resolve, delay));

				// Recursive retry
				return executeWithRetry(
					operation,
					operationType,
					operationData,
					maxRetries,
				);
			}

			throw error;
		}
	};

	const validateHistoryFilter = (
		field: keyof typeof historyFilters,
		value: string,
		currentFilters: typeof historyFilters,
	): string => {
		switch (field) {
			case 'productCode':
				if (value && value.trim().length < 2) {
					return 'Código deve ter pelo menos 2 caracteres';
				}
				if (value && value.trim().length > 50) {
					return 'Código deve ter no máximo 50 caracteres';
				}
				return '';

			case 'startDate':
				if (value && currentFilters.endDate && value > currentFilters.endDate) {
					return 'Data inicial deve ser anterior à data final';
				}
				if (value && new Date(value) > new Date()) {
					return 'Data inicial não pode ser futura';
				}
				return '';

			case 'endDate':
				if (
					value &&
					currentFilters.startDate &&
					value < currentFilters.startDate
				) {
					return 'Data final deve ser posterior à data inicial';
				}
				if (value && new Date(value) > new Date()) {
					return 'Data final não pode ser futura';
				}
				return '';

			default:
				return '';
		}
	};

	const handleFilterChange = (
		field: keyof typeof historyFilters,
		value: string,
	) => {
		setHistoryFilters((prev) => {
			const newFilters = { ...prev, [field]: value };

			// Validate the filter change
			const validationError = validateHistoryFilter(field, value, newFilters);
			if (validationError) {
				toastService.error(validationError);
				return prev;
			}

			return newFilters;
		});
	};

	const clearFilters = () => {
		setHistoryFilters({
			productCode: '',
			adjustmentType: '',
			startDate: '',
			endDate: '',
		});
		toastService.info(TOAST_MESSAGES.inventory.filtersCleared);
	};

	const loadMoreHistory = () => {
		if (historyPagination.hasNext && !isLoadingHistory) {
			loadStockHistory(historyPagination.page + 1, false);
		}
	};

	const loadStockHistory = async (
		page: number = 1,
		resetData: boolean = true,
	) => {
		if (!isOnline) {
			toastService.warning(TOAST_MESSAGES.inventory.offlineMode);
			return;
		}

		setIsLoadingHistory(true);

		// Show loading notification for initial load
		if (resetData && page === 1) {
			toastService.info(TOAST_MESSAGES.inventory.loadingHistory, {
				autoClose: 2000,
			});
		}

		try {
			const filters = {
				page,
				limit: historyPagination.limit,
				...(historyFilters.productCode && {
					productCode: historyFilters.productCode,
				}),
				...(historyFilters.adjustmentType && {
					adjustmentType: historyFilters.adjustmentType,
				}),
				...(historyFilters.startDate && {
					startDate: historyFilters.startDate,
				}),
				...(historyFilters.endDate && { endDate: historyFilters.endDate }),
			};

			const response = await executeWithRetry(
				() => inventoryService.getStockHistory(filters),
				'history',
				{ page, resetData, filters },
			);

			if (resetData) {
				setAdjustments(response.data);
			} else {
				// Append data for infinite scroll
				setAdjustments((prev) => [...prev, ...response.data]);
			}

			setHistoryPagination(response.pagination);
		} catch (error) {
			const inventoryError = error as InventoryError;
			console.error('Error loading stock history:', inventoryError);

			// Show specific error message based on error type
			let errorMessage: string = TOAST_MESSAGES.inventory.historyLoadError;
			if (inventoryError.code === 'NETWORK_ERROR') {
				errorMessage = TOAST_MESSAGES.inventory.networkError;
			} else if (inventoryError.code === 'SERVER_ERROR') {
				errorMessage = TOAST_MESSAGES.inventory.serverError;
			} else if (inventoryError.code === 'UNAUTHORIZED') {
				errorMessage = TOAST_MESSAGES.inventory.unauthorizedError;
			} else if (inventoryError.message) {
				errorMessage = inventoryError.message;
			}

			toastService.error(errorMessage);
		} finally {
			setIsLoadingHistory(false);
		}
	};

	const handleInputChange = (field: string) => (value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));

		// Clear existing timeout for this field
		if (validationTimeouts[field]) {
			clearTimeout(validationTimeouts[field]);
		}

		// Clear field error immediately when user starts typing
		if (formErrors[field]) {
			setFormErrors((prev) => ({ ...prev, [field]: '' }));
		}

		// Set up debounced validation
		const timeoutId = setTimeout(() => {
			const fieldError = validateField(field, value);
			setFormErrors((prev) => ({ ...prev, [field]: fieldError }));

			// Remove timeout from state
			setValidationTimeouts((prev) => {
				const newTimeouts = { ...prev };
				delete newTimeouts[field];
				return newTimeouts;
			});
		}, 500);

		// Store timeout ID
		setValidationTimeouts((prev) => ({ ...prev, [field]: timeoutId }));

		// When product code changes, search for the product
		if (field === 'productCode') {
			searchProductByCode(value);
		}
	};

	const validateForm = (): boolean => {
		const errors: { [key: string]: string } = {};

		// Product code validation
		if (!formData.productCode.trim()) {
			errors.productCode = TOAST_MESSAGES.inventory.productCodeRequired;
		} else if (formData.productCode.trim().length < 2) {
			errors.productCode = 'Código do produto deve ter pelo menos 2 caracteres';
		} else if (formData.productCode.trim().length > 50) {
			errors.productCode = 'Código do produto deve ter no máximo 50 caracteres';
		} else if (!selectedProduct) {
			errors.productCode = TOAST_MESSAGES.inventory.productNotFound;
		}

		// Quantity validation
		if (!formData.quantity.trim()) {
			errors.quantity = TOAST_MESSAGES.inventory.quantityRequired;
		} else {
			const quantity = Number(formData.quantity);
			if (isNaN(quantity)) {
				errors.quantity = 'Quantidade deve ser um número válido';
			} else if (quantity <= 0) {
				errors.quantity = TOAST_MESSAGES.inventory.invalidQuantity;
			} else if (quantity > 999999) {
				errors.quantity = TOAST_MESSAGES.inventory.quantityTooHigh;
			} else if (!Number.isInteger(quantity)) {
				errors.quantity = 'Quantidade deve ser um número inteiro';
			}
		}

		// Reason validation
		if (!formData.reason.trim()) {
			errors.reason = TOAST_MESSAGES.inventory.reasonRequired;
		} else if (formData.reason.trim().length < 3) {
			errors.reason = TOAST_MESSAGES.inventory.reasonTooShort;
		} else if (formData.reason.trim().length > 500) {
			errors.reason = TOAST_MESSAGES.inventory.reasonTooLong;
		} else if (
			!/^[a-zA-Z0-9\s\-.,!?()áéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]+$/.test(
				formData.reason.trim(),
			)
		) {
			errors.reason = 'Motivo contém caracteres inválidos';
		}

		// Check for insufficient stock on remove operations
		if (
			selectedProduct &&
			formData.adjustmentType === 'remove' &&
			formData.quantity
		) {
			const quantity = Number(formData.quantity);
			if (!isNaN(quantity) && quantity > selectedProduct.stock) {
				errors.quantity = `${TOAST_MESSAGES.inventory.insufficientStock} Disponível: ${selectedProduct.stock}`;
			}
		}

		// Business logic validation
		if (
			selectedProduct &&
			formData.adjustmentType === 'add' &&
			formData.quantity
		) {
			const quantity = Number(formData.quantity);
			const newStock = selectedProduct.stock + quantity;
			if (newStock > 999999) {
				errors.quantity =
					'O estoque resultante seria muito alto (máximo: 999.999)';
			}
		}

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// Real-time validation for individual fields
	const validateField = (field: string, value: string): string => {
		switch (field) {
			case 'productCode':
				if (!value.trim()) return TOAST_MESSAGES.inventory.productCodeRequired;
				if (value.trim().length < 2)
					return 'Código deve ter pelo menos 2 caracteres';
				if (value.trim().length > 50)
					return 'Código deve ter no máximo 50 caracteres';
				if (value.trim() && !selectedProduct && !isSearchingProduct)
					return TOAST_MESSAGES.inventory.productNotFound;
				return '';

			case 'quantity': {
				if (!value.trim()) return TOAST_MESSAGES.inventory.quantityRequired;
				const quantity = Number(value);
				if (isNaN(quantity)) return 'Quantidade deve ser um número válido';
				if (quantity <= 0) return TOAST_MESSAGES.inventory.invalidQuantity;
				if (quantity > 999999) return TOAST_MESSAGES.inventory.quantityTooHigh;
				if (!Number.isInteger(quantity))
					return 'Quantidade deve ser um número inteiro';

				// Check stock limits for remove operations
				if (
					selectedProduct &&
					formData.adjustmentType === 'remove' &&
					quantity > selectedProduct.stock
				) {
					return `${TOAST_MESSAGES.inventory.insufficientStock} Disponível: ${selectedProduct.stock}`;
				}

				// Check maximum stock for add operations
				if (selectedProduct && formData.adjustmentType === 'add') {
					const newStock = selectedProduct.stock + quantity;
					if (newStock > 999999) {
						return 'O estoque resultante seria muito alto (máximo: 999.999)';
					}
				}
				return '';
			}

			case 'reason':
				if (!value.trim()) return TOAST_MESSAGES.inventory.reasonRequired;
				if (value.trim().length < 3)
					return TOAST_MESSAGES.inventory.reasonTooShort;
				if (value.trim().length > 500)
					return TOAST_MESSAGES.inventory.reasonTooLong;
				if (
					!/^[a-zA-Z0-9\s\-.,!?()áéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]+$/.test(
						value.trim(),
					)
				) {
					return 'Motivo contém caracteres inválidos';
				}
				return '';

			default:
				return '';
		}
	};

	const searchProductByCode = async (code: string) => {
		if (!code.trim()) {
			setSelectedProduct(null);
			return;
		}

		if (!isOnline) {
			toastService.warning(TOAST_MESSAGES.inventory.offlineMode);
			return;
		}

		setIsSearchingProduct(true);
		try {
			const product = await executeWithRetry(
				() => inventoryService.searchProductByCode(code),
				'search',
				{ code },
				2,
			);
			setSelectedProduct(product);
		} catch (error) {
			console.error('Error searching product by code:', error);
			setSelectedProduct(null);
		} finally {
			setIsSearchingProduct(false);
		}
	};

	// Refresh selected product data to handle concurrent updates
	const refreshSelectedProduct = async () => {
		if (!selectedProduct || !isOnline) return;

		try {
			const refreshedProduct = await inventoryService.getProduct(
				selectedProduct.id,
			);
			setSelectedProduct(refreshedProduct);

			// Show warning if stock changed
			if (refreshedProduct.stock !== selectedProduct.stock) {
				toastService.info(
					`Estoque atualizado: ${refreshedProduct.stock} ${refreshedProduct.unit}`,
				);
			}
		} catch (error) {
			console.error('Error refreshing product:', error);
		}
	};

	// Load stock history when component mounts or when switching to history tab
	useEffect(() => {
		if (activeTab === 'history') {
			loadStockHistory(1, true);
		}
	}, [activeTab]);

	// Cleanup validation timeouts on unmount
	useEffect(() => {
		return () => {
			Object.values(validationTimeouts).forEach((timeout) => {
				if (timeout) clearTimeout(timeout);
			});
		};
	}, [validationTimeouts]);

	// Handle online/offline status
	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);
			toastService.success(TOAST_MESSAGES.inventory.connectionRestored);

			// Retry last failed operation if it was recent (within 5 minutes)
			if (
				lastFailedOperation &&
				Date.now() - lastFailedOperation.timestamp < 300000
			) {
				retryLastFailedOperation();
			}
		};

		const handleOffline = () => {
			setIsOnline(false);
			toastService.warning(TOAST_MESSAGES.inventory.offlineMode, {
				autoClose: false,
			});
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, [lastFailedOperation]);

	// Periodic refresh of selected product to detect concurrent changes
	useEffect(() => {
		if (!selectedProduct || !isOnline || activeTab !== 'adjustment') return;

		const refreshInterval = setInterval(() => {
			refreshSelectedProduct();
		}, 30000); // Refresh every 30 seconds

		return () => clearInterval(refreshInterval);
	}, [selectedProduct, isOnline, activeTab]);

	const handleProductSelect = (product: Product) => {
		setFormData((prev) => ({ ...prev, productCode: product.code }));
		setSelectedProduct(product);
		setShowProductSearch(false);
		setSearchTerm('');
		setSortBy('name');
		setFilterByStock('all');
	};

	// Debounced search function
	const debouncedSearchProducts = useCallback(
		debounce(async (query: string) => {
			if (!isOnline) {
				toastService.warning(TOAST_MESSAGES.inventory.offlineMode);
				return;
			}

			setIsLoadingProducts(true);
			try {
				const searchResults = await executeWithRetry(
					() => inventoryService.searchProducts(query, 20),
					'search',
					{ query },
					2, // Fewer retries for search operations
				);
				setProducts(searchResults);
			} catch (error) {
				const inventoryError = error as InventoryError;
				console.error('Error searching products:', inventoryError);

				// Show specific error message based on error type
				let errorMessage: string = TOAST_MESSAGES.inventory.searchError;
				if (inventoryError.code === 'NETWORK_ERROR') {
					errorMessage = TOAST_MESSAGES.inventory.networkError;
				} else if (inventoryError.code === 'SERVER_ERROR') {
					errorMessage = TOAST_MESSAGES.inventory.serverError;
				} else if (inventoryError.message) {
					errorMessage = inventoryError.message;
				}

				toastService.error(errorMessage);
				setProducts([]);
			} finally {
				setIsLoadingProducts(false);
			}
		}, 300),
		[isOnline],
	);

	// Search products using API with debouncing
	useEffect(() => {
		if (showProductSearch) {
			if (searchTerm.trim()) {
				debouncedSearchProducts(searchTerm);
			} else {
				// Load initial products when modal opens
				debouncedSearchProducts('');
			}
		}

		// Cleanup function to cancel pending debounced calls
		return () => {
			debouncedSearchProducts.cancel?.();
		};
	}, [searchTerm, showProductSearch, debouncedSearchProducts]);

	// Simple debounce utility function
	function debounce<T extends (...args: any[]) => any>(
		func: T,
		wait: number,
	): T & { cancel?: () => void } {
		let timeout: NodeJS.Timeout | null = null;

		const debounced = ((...args: Parameters<T>) => {
			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(() => func(...args), wait);
		}) as T & { cancel?: () => void };

		debounced.cancel = () => {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
		};

		return debounced;
	}

	// Sort and filter products for display
	const getFilteredAndSortedProducts = useCallback(() => {
		let filteredProducts = [...products];

		// Apply stock filter
		if (filterByStock === 'in_stock') {
			filteredProducts = filteredProducts.filter(
				(product) => product.stock > 0,
			);
		} else if (filterByStock === 'low_stock') {
			filteredProducts = filteredProducts.filter(
				(product) => product.stock <= 10,
			); // Assuming low stock is <= 10
		}

		// Apply sorting
		filteredProducts.sort((a, b) => {
			switch (sortBy) {
				case 'name':
					return a.name.localeCompare(b.name);
				case 'code':
					return a.code.localeCompare(b.code);
				case 'stock':
					return b.stock - a.stock; // Descending order for stock
				default:
					return 0;
			}
		});

		return filteredProducts;
	}, [products, sortBy, filterByStock]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Check if online
		if (!isOnline) {
			toastService.warning(TOAST_MESSAGES.inventory.offlineMode);
			return;
		}

		// Validate form before submission
		if (!validateForm()) {
			toastService.error(TOAST_MESSAGES.inventory.formValidationError);
			return;
		}

		setIsSubmitting(true);

		// Show processing notification
		toastService.info(TOAST_MESSAGES.inventory.processingAdjustment, {
			autoClose: 2000,
		});

		try {
			const adjustmentRequest: StockAdjustmentRequest = {
				adjustmentType: formData.adjustmentType,
				quantity: Number(formData.quantity),
				reason: formData.reason.trim(),
			};

			// Store current product stock for concurrent update detection
			const currentProductStock = selectedProduct!.stock;

			// Execute stock adjustment without retry to prevent duplicate operations
			const updatedProduct = await inventoryService.adjustStock(
				selectedProduct!.id,
				adjustmentRequest,
			);

			// Check for concurrent updates (basic optimistic locking)
			if (
				formData.adjustmentType === 'remove' &&
				currentProductStock !== selectedProduct!.stock &&
				updatedProduct.stock !== currentProductStock - Number(formData.quantity)
			) {
				toastService.warning(
					'O estoque foi alterado por outro usuário. Verifique o valor atual.',
				);
			}

			// Update selected product with new stock
			setSelectedProduct(updatedProduct);

			// Show specific success toast based on action type
			const toastMessage =
				formData.adjustmentType === 'add'
					? `${TOAST_MESSAGES.inventory.stockAdded} Quantidade: ${formData.quantity}`
					: `${TOAST_MESSAGES.inventory.stockRemoved} Quantidade: ${formData.quantity}`;
			toastService.success(toastMessage);

			// Reset form
			setFormData({
				productCode: '',
				quantity: '',
				adjustmentType: 'add',
				reason: '',
			});
			setSelectedProduct(null);
			setFormErrors({});

			// Reload history if we're on the history tab
			if (activeTab === 'history') {
				loadStockHistory(1, true);
			}
		} catch (error) {
			const inventoryError = error as InventoryError;
			console.error('Error adjusting stock:', inventoryError);

			// Show specific error messages based on error type
			let errorMessage: string = TOAST_MESSAGES.inventory.serverError;

			switch (inventoryError.code) {
				case 'INSUFFICIENT_STOCK':
					errorMessage = TOAST_MESSAGES.inventory.insufficientStock;
					break;
				case 'NOT_FOUND':
					errorMessage = TOAST_MESSAGES.inventory.productNotFound;
					break;
				case 'VALIDATION_ERROR':
					errorMessage =
						inventoryError.message || TOAST_MESSAGES.inventory.validationError;
					break;
				case 'NETWORK_ERROR':
					errorMessage = TOAST_MESSAGES.inventory.networkError;
					break;
				case 'UNAUTHORIZED':
					errorMessage = TOAST_MESSAGES.inventory.unauthorizedError;
					break;
				case 'CONFLICT':
					errorMessage = TOAST_MESSAGES.inventory.conflictError;
					break;
				case 'SERVER_ERROR':
					errorMessage = TOAST_MESSAGES.inventory.serverError;
					break;
				default:
					errorMessage =
						inventoryError.message || TOAST_MESSAGES.inventory.serverError;
			}

			toastService.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderTabContent = () => {
		if (activeTab === 'adjustment') {
			return (
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-gray-800">
							Ajuste de Estoque
						</h2>
						<div className="flex items-center space-x-4">
							<button
								type="button"
								onClick={() => window.location.reload()}
								disabled={isSubmitting}
								className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
								title="Atualizar página"
							>
								<RefreshCw
									size={16}
									className={isSubmitting ? 'animate-spin' : ''}
								/>
							</button>
						</div>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								Informações do Ajuste
							</h3>

							<div className="space-y-6">
								{/* Product Selection */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<Input
											label="Código do Produto"
											value={formData.productCode}
											onChange={handleInputChange('productCode')}
											placeholder="Digite o código do produto"
											error={formErrors.productCode}
											required
										/>
										{isSearchingProduct && (
											<p className="mt-1 text-sm text-blue-600">
												Buscando produto...
											</p>
										)}
									</div>

									<div>
										<Button
											type="button"
											variant="secondary"
											onClick={() => setShowProductSearch(true)}
											className="mt-6"
										>
											<Search size={16} className="mr-2" />
											Buscar Produto
										</Button>
									</div>
								</div>

								{/* Selected Product Info */}
								{selectedProduct && (
									<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
										<div className="flex items-start justify-between">
											<div>
												<h4 className="font-medium text-blue-900">
													{selectedProduct.name}
												</h4>
												<p className="text-sm text-blue-700">
													Código: {selectedProduct.code}
												</p>
												<p className="text-sm text-blue-700">
													Estoque atual: {selectedProduct.stock}{' '}
													{selectedProduct.unit}
												</p>
											</div>
											<Package className="text-blue-600" size={24} />
										</div>
									</div>
								)}

								{/* Adjustment Details */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Tipo de Ajuste <span className="text-red-500">*</span>
										</label>
										<div className="flex space-x-3">
											<button
												type="button"
												onClick={() =>
													handleInputChange('adjustmentType')('add')
												}
												className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md border transition-all duration-200 ${
													formData.adjustmentType === 'add'
														? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
														: 'border-gray-300 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50'
												}`}
											>
												<Plus size={16} className="mr-2" />
												<span className="font-medium text-sm">Adicionar</span>
											</button>
											<button
												type="button"
												onClick={() =>
													handleInputChange('adjustmentType')('remove')
												}
												className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md border transition-all duration-200 ${
													formData.adjustmentType === 'remove'
														? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
														: 'border-gray-300 bg-white text-gray-600 hover:border-red-300 hover:bg-red-50'
												}`}
											>
												<Minus size={16} className="mr-2" />
												<span className="font-medium text-sm">Remover</span>
											</button>
										</div>
									</div>

									<Input
										label="Quantidade"
										type="number"
										value={formData.quantity}
										onChange={handleInputChange('quantity')}
										placeholder="Digite a quantidade"
										error={formErrors.quantity}
										min="1"
										required
									/>
								</div>

								{/* Reason */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Motivo do Ajuste <span className="text-red-500">*</span>
									</label>
									<textarea
										value={formData.reason}
										onChange={(e) =>
											handleInputChange('reason')(e.target.value)
										}
										placeholder="Descreva o motivo do ajuste de estoque"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
										rows={3}
										maxLength={500}
									/>
									{formErrors.reason && (
										<p className="mt-1 text-sm text-red-600">
											{formErrors.reason}
										</p>
									)}
									<div className="flex justify-end mt-1">
										<span
											className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
												formData.reason.length >= 450
													? 'bg-red-100 text-red-800'
													: 'bg-green-100 text-green-800'
											}`}
										>
											{formData.reason.length} / 500
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex justify-end space-x-3">
							<Button
								type="button"
								variant="secondary"
								onClick={() => {
									setFormData({
										productCode: '',
										quantity: '',
										adjustmentType: 'add',
										reason: '',
									});
									setSelectedProduct(null);
									setFormErrors({});
								}}
							>
								Limpar
							</Button>
							<Button
								type="submit"
								variant="primary"
								disabled={
									isSubmitting ||
									!formData.productCode ||
									!formData.quantity ||
									!formData.reason ||
									!selectedProduct
								}
								loading={isSubmitting}
							>
								{formData.adjustmentType === 'add'
									? 'Adicionar ao Estoque'
									: 'Remover do Estoque'}
							</Button>
						</div>
					</form>
				</div>
			);
		}

		if (activeTab === 'history') {
			return (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-gray-800">
							Histórico de Ajustes
						</h2>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-500">
								{historyPagination.total} ajustes
							</span>
							<button
								type="button"
								onClick={() => loadStockHistory(1, true)}
								disabled={isLoadingHistory}
								className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
								title="Atualizar histórico"
							>
								<RefreshCw
									size={16}
									className={isLoadingHistory ? 'animate-spin' : ''}
								/>
							</button>
						</div>
					</div>

					{/* Filters */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-medium text-gray-900">Filtros</h3>
							<Button
								type="button"
								variant="secondary"
								size="sm"
								onClick={clearFilters}
							>
								<X size={14} className="mr-1" />
								Limpar
							</Button>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<Input
								label="Código do Produto"
								value={historyFilters.productCode}
								onChange={(value) => handleFilterChange('productCode', value)}
								placeholder="Filtrar por código"
							/>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Tipo de Ajuste
								</label>
								<select
									value={historyFilters.adjustmentType}
									onChange={(e) =>
										handleFilterChange('adjustmentType', e.target.value)
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									<option value="">Todos</option>
									<option value="add">Adição</option>
									<option value="remove">Remoção</option>
								</select>
							</div>

							<Input
								label="Data Inicial"
								type="date"
								value={historyFilters.startDate}
								onChange={(value) => handleFilterChange('startDate', value)}
							/>

							<Input
								label="Data Final"
								type="date"
								value={historyFilters.endDate}
								onChange={(value) => handleFilterChange('endDate', value)}
							/>
						</div>
					</div>

					{/* Loading State */}
					{isLoadingHistory && (
						<div className="flex justify-center items-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
							<span className="ml-2 text-gray-600">
								Carregando histórico...
							</span>
						</div>
					)}

					{/* History List */}
					{!isLoadingHistory && (
						<div className="space-y-3">
							{adjustments.map((adjustment) => (
								<div
									key={adjustment.id}
									className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
								>
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<div className="flex items-center space-x-3">
												<div
													className={`p-2 rounded-full ${
														adjustment.adjustmentType === 'add'
															? 'bg-green-100 text-green-600'
															: 'bg-red-100 text-red-600'
													}`}
												>
													{adjustment.adjustmentType === 'add' ? (
														<Plus size={16} />
													) : (
														<Minus size={16} />
													)}
												</div>
												<div>
													<h4 className="font-medium text-gray-900">
														Produto ID: {adjustment.productId}
													</h4>
													<p className="text-sm text-gray-600">
														Ajuste #{adjustment.id}
													</p>
												</div>
											</div>
											<div className="mt-2 ml-11">
												<p className="text-sm text-gray-700">
													<span className="font-medium">Quantidade:</span>{' '}
													{adjustment.quantity}
												</p>
												<p className="text-sm text-gray-700">
													<span className="font-medium">Motivo:</span>{' '}
													{adjustment.reason}
												</p>
											</div>
										</div>
										<div className="text-right">
											<p className="text-sm text-gray-500">
												{new Date(adjustment.createdAt).toLocaleDateString(
													'pt-BR',
												)}
											</p>
											<p className="text-xs text-gray-400">
												{new Date(adjustment.createdAt).toLocaleTimeString(
													'pt-BR',
												)}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{!isLoadingHistory && adjustments.length === 0 && (
						<div className="text-center py-8">
							<History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
							<p className="text-gray-500">
								Nenhum ajuste de estoque encontrado.
							</p>
						</div>
					)}

					{/* Load More Button */}
					{historyPagination.hasNext && (
						<div className="flex justify-center mt-6">
							<Button
								type="button"
								variant="secondary"
								onClick={loadMoreHistory}
								disabled={isLoadingHistory}
							>
								Carregar Mais
							</Button>
						</div>
					)}
				</div>
			);
		}

		return null;
	};

	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Inventário</h1>
				<p className="text-gray-600 mt-1">
					Gerencie o estoque dos produtos e visualize o histórico de ajustes
				</p>
			</div>

			{/* Tabs */}
			<div className="mb-6">
				<div className="border-b border-gray-200">
					<nav className="-mb-px flex space-x-8" aria-label="Tabs">
						<button
							type="button"
							onClick={() => setActiveTab('adjustment')}
							className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
								activeTab === 'adjustment'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							}`}
						>
							<Package size={16} className="inline mr-2" />
							Ajuste de Estoque
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('history')}
							className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
								activeTab === 'history'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							}`}
						>
							<History size={16} className="inline mr-2" />
							Histórico
						</button>
					</nav>
				</div>
			</div>

			{/* Tab Content */}
			<div className="mt-6">{renderTabContent()}</div>

			{/* Product Search Modal */}
			{showProductSearch && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
					onClick={() => setShowProductSearch(false)}
				>
					<div
						className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="p-6 border-b border-gray-200">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-medium text-gray-900">
									Selecionar Produto
								</h3>
								<button
									type="button"
									onClick={() => setShowProductSearch(false)}
									className="text-gray-400 hover:text-gray-600"
								>
									<X size={24} />
								</button>
							</div>
							<div className="mt-4">
								<div className="relative">
									<Search
										className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
										size={16}
									/>
									<input
										type="text"
										placeholder="Buscar produtos por nome ou código..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
							</div>
						</div>

						<div className="p-6 overflow-y-auto max-h-96">
							{isLoadingProducts && (
								<div className="flex justify-center items-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
									<span className="ml-2 text-gray-600">
										Carregando produtos...
									</span>
								</div>
							)}

							{!isLoadingProducts && (
								<div className="space-y-2">
									{getFilteredAndSortedProducts().map((product) => (
										<div
											key={product.id}
											onClick={() => handleProductSelect(product)}
											className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
										>
											<div className="flex justify-between items-start">
												<div>
													<h4 className="font-medium text-gray-900">
														{product.name}
													</h4>
													<p className="text-sm text-gray-600">
														Código: {product.code}
													</p>
												</div>
												<div className="text-right">
													<p className="text-sm font-medium text-gray-900">
														Estoque: {product.stock} {product.unit}
													</p>
													<p className="text-xs text-gray-500">
														R$ {product.salePrice?.toFixed(2) || '0.00'}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>
							)}

							{!isLoadingProducts &&
								getFilteredAndSortedProducts().length === 0 && (
									<div className="text-center py-8">
										<Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
										<p className="text-gray-500">
											{searchTerm
												? 'Nenhum produto encontrado para a busca.'
												: 'Nenhum produto disponível.'}
										</p>
									</div>
								)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default InventoryPage;
