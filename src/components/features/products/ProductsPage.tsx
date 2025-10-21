import { RefreshCw, Search, SquarePen, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { usePricing } from '../../../hooks/usePricing';
import { useProducts } from '../../../hooks/useProducts';
import { TOAST_MESSAGES } from '../../../services/ToastService';
import type { Product } from '../../../types';
import type { CreateProductRequest } from '../../../types/api';
import { AutoCodeService } from '../../../utils';
import Button from '../../common/Button';
import type { CheckboxOption } from '../../common/CheckboxGroup';
import CheckboxGroup from '../../common/CheckboxGroup';
import Input from '../../common/Input';
import type { SelectOption } from '../../common/Select';
import Select from '../../common/Select';

type TabType = 'list' | 'register';
type SubTabType = 'basic' | 'pricesStock';

const ProductsPage: React.FC = () => {
	const { isAdmin, isEmployee, hasPermission, user } = useAuth();
	const [activeTab, setActiveTab] = useState<TabType>('list');
	const [activeSubTab, setActiveSubTab] = useState<SubTabType>('basic');
	const [searchQuery, setSearchQuery] = useState('');
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [currentFilters] = useState({});

	// Use the products hook for API integration
	const {
		products,
		isLoading,
		error,
		pagination,
		fetchProducts,
		createProduct,
		updateProduct,
		deleteProduct,
		searchProducts,
		refreshProducts,
		clearError,
	} = useProducts();

	// Use the pricing hook for price calculations
	const { priceSuggestions, getPriceSuggestions, isCalculating } = usePricing();

	// Initialize auto code service with existing product codes
	useEffect(() => {
		const existingCodes = products
			.map((p) => p.code)
			.filter((code) => code && typeof code === 'string');
		AutoCodeService.initializeFromExisting('product', existingCodes);
	}, [products]);

	// Options for dropdowns
	const unitOptions: SelectOption[] = [
		{ value: 'pc', label: 'Peça (PC)' },
		{ value: 'un', label: 'Unidade (UN)' },
		{ value: 'kg', label: 'Quilograma (KG)' },
		{ value: 'g', label: 'Grama (G)' },
		{ value: 'l', label: 'Litro (L)' },
	];

	const saleTypeOptions: CheckboxOption[] = [
		{
			value: 'unit',
			label: 'Venda por Unidade',
			description: 'Produto vendido em unidades inteiras',
		},
		{
			value: 'fractional',
			label: 'Venda Fracionada',
			description: 'Produto vendido em frações (peso, volume, etc.)',
		},
	];

	const [formData, setFormData] = useState({
		code: '',
		name: '',
		description: '',
		unit: 'un',
		stock: '',
		saleType: 'unit' as 'unit' | 'fractional',
		purchasePrice: '',
		markup: '',
		salePrice: '',
	});

	const handleInputChange = (field: string) => (value: string) => {
		setFormData((prev) => {
			const updated = { ...prev, [field]: value };

			// Note: Price calculation is now handled in the render function
			// to show real-time suggestions without auto-filling the field

			return updated;
		});
	};

	// Generate new product code when switching to register tab
	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab);
		if (tab === 'register' && !formData.code) {
			const newCode = AutoCodeService.generateCode('product');
			setFormData((prev) => ({ ...prev, code: newCode }));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			// Prepare product data for API
			const productData: CreateProductRequest = {
				code: formData.code || undefined, // Let backend generate if empty
				name: formData.name,
				unit: formData.unit,
				description: formData.description || undefined,
				stock: formData.stock ? parseInt(formData.stock) : 0,
				purchasePrice: formData.purchasePrice,
				salePrice: formData.salePrice,
				saleType: formData.saleType,
			};

			let success = false;

			if (editingProduct) {
				// Update existing product - remove code field as it's immutable
				const { code, ...updateData } = productData;
				const result = await updateProduct(editingProduct.id, updateData);
				success = result !== null;
				setEditingProduct(null);
			} else {
				// Create new product
				const result = await createProduct(productData);
				success = result !== null;
			}

			// Only proceed with UI updates if the operation was successful
			if (success) {
				// Reset form after successful submit
				setFormData({
					code: '',
					name: '',
					description: '',
					unit: 'un',
					stock: '',
					saleType: 'unit' as 'unit' | 'fractional',
					purchasePrice: '',
					markup: '',
					salePrice: '',
				});

				// Always refresh the list to ensure consistency
				// This handles cases where the operation succeeded on the backend
				// but there was an issue with local state synchronization
				await refreshProducts();

				// Switch back to list tab
				setActiveTab('list');
				setActiveSubTab('basic');
			} else {
				// If the operation failed, still refresh to ensure consistency
				await refreshProducts();
			}
		} catch (error) {
			// Error handling is done in the hook, but let's refresh the list anyway
			// in case the operation succeeded on the backend
			console.error('Error submitting product:', error);
			await refreshProducts();
		}
	};

	// Functions for product operations
	const handleEditProduct = (product: Product) => {
		setEditingProduct(product);
		setFormData({
			code: product.code,
			name: product.name,
			description: product.description || '',
			unit: product.unit,
			stock: product.stock.toString(),
			saleType: product.saleType,
			purchasePrice: product.purchasePrice.toString(),
			markup: '',
			salePrice: product.salePrice.toString(),
		});
		setActiveTab('register');
		setActiveSubTab('basic');
	};

	const handleDeleteProduct = async (product: Product) => {
		if (confirm(TOAST_MESSAGES.product.deleteConfirm)) {
			const success = await deleteProduct(product.id);
			if (success) {
				// Refresh the products list after successful deletion
				await refreshProducts();
			}
		}
	};

	// Search functionality
	const handleSearch = async () => {
		if (searchQuery.trim()) {
			await searchProducts(searchQuery);
		} else {
			await refreshProducts();
		}
	};

	const renderTabContent = () => {
		if (activeTab === 'list') {
			return (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-gray-800">
							Produtos Cadastrados
						</h2>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-500">
								{pagination
									? `${pagination.total} produtos`
									: `${products.length} produtos`}
							</span>
							<button
								type="button"
								onClick={refreshProducts}
								disabled={isLoading}
								className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
								title="Atualizar lista"
							>
								<RefreshCw
									size={16}
									className={isLoading ? 'animate-spin' : ''}
								/>
							</button>
						</div>
					</div>

					{/* Search Bar */}
					<div className="flex items-center space-x-2">
						<div className="flex-1 relative">
							<Search
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
								size={16}
							/>
							<input
								type="text"
								placeholder="Buscar produtos por nome ou código..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<Button
							onClick={handleSearch}
							disabled={isLoading}
							variant="secondary"
						>
							Buscar
						</Button>
					</div>

					{/* Error Display */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<div className="flex items-center justify-between">
								<p className="text-red-700">{error}</p>
								<button
									type="button"
									onClick={clearError}
									className="text-red-500 hover:text-red-700"
								>
									×
								</button>
							</div>
						</div>
					)}

					{/* Loading State */}
					{isLoading && (
						<div className="flex justify-center items-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
							<span className="ml-2 text-gray-600">Carregando produtos...</span>
						</div>
					)}

					{!isLoading && (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{products.map((product) => (
								<div
									key={product.id}
									className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow flex flex-col h-full" // Adicionado flex flex-col h-full
								>
									<div className="flex justify-between items-start mb-2">
										<div className="flex-grow pr-2">
											<h3 className="font-semibold text-gray-900 line-clamp-1">
												{product.name}
											</h3>
											<p className="text-xs text-gray-600">
												Código Interno: {product.code}
											</p>
										</div>
										<div className="text-right flex-shrink-0">
											<p className="text-lg font-bold text-green-600 whitespace-nowrap">
												R${' '}
												{product.salePrice
													? product.salePrice.toFixed(2)
													: '0.00'}
											</p>
											<p className="text-sm text-gray-500">{product.unit}</p>
										</div>
									</div>
									<div className="text-gray-700 text-sm mb-3">
										{product.description ? (
											<p className="line-clamp-2">{product.description}</p>
										) : (
											<p className="italic text-gray-400 min-h-[3.5rem]">
												Sem Descrição
											</p>
										)}
									</div>
									<div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-auto">
										{product.stock > 0 ? (
											<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
												Estoque:{' '}
												<span className="font-semibold">{product.stock}</span>
											</span>
										) : (
											<span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
												Estoque:{' '}
												<span className="font-semibold">{product.stock}</span>
											</span>
										)}
										{(isAdmin || hasPermission('modules.products')) && (
											<div className="flex space-x-2">
												<button
													type="button"
													className="text-blue-600 hover:text-blue-800 text-sm"
													onClick={() => handleEditProduct(product)}
													title="Editar produto"
												>
													<SquarePen size={16} />
												</button>
												<button
													type="button"
													className="text-red-600 hover:text-red-800 text-sm"
													onClick={() => handleDeleteProduct(product)}
													title="Excluir produto"
												>
													<Trash2 size={16} />
												</button>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					)}

					{!isLoading && products.length === 0 && (
						<div className="text-center py-8">
							<p className="text-gray-500">
								{searchQuery
									? 'Nenhum produto encontrado para a busca.'
									: 'Nenhum produto cadastrado ainda.'}
							</p>
						</div>
					)}

					{/* Pagination */}
					{pagination && pagination.totalPages > 1 && (
						<div className="flex justify-center items-center space-x-2 mt-6">
							<Button
								onClick={() =>
									fetchProducts({
										...currentFilters,
										page: pagination.page - 1,
									})
								}
								disabled={!pagination.hasPrev || isLoading}
								variant="secondary"
								size="sm"
							>
								Anterior
							</Button>
							<span className="text-sm text-gray-600">
								Página {pagination.page} de {pagination.totalPages}
							</span>
							<Button
								onClick={() =>
									fetchProducts({
										...currentFilters,
										page: pagination.page + 1,
									})
								}
								disabled={!pagination.hasNext || isLoading}
								variant="secondary"
								size="sm"
							>
								Próxima
							</Button>
						</div>
					)}
				</div>
			);
		}

		const renderSubTabContent = () => {
			if (activeSubTab === 'basic') {
				return (
					<div className="space-y-6">
						{/* First row: Code and Product Name */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Input
								label="Código"
								value={formData.code}
								onChange={handleInputChange('code')}
								placeholder="Código auto-gerado"
								readOnly
								className="w-1/3"
								required
							/>

							<Input
								label="Nome do Produto"
								value={formData.name}
								onChange={handleInputChange('name')}
								placeholder="Digite o nome do produto"
								maxLength={50}
								required
							/>
						</div>

						{/* Second row: Unit and Sale Type */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Select
								label="Unidade de Medida"
								value={formData.unit}
								onChange={handleInputChange('unit')}
								options={unitOptions}
								placeholder="Selecione a unidade"
								size="sm"
								required
							/>

							<CheckboxGroup
								label="Tipo de Venda"
								value={formData.saleType}
								onChange={handleInputChange('saleType')}
								options={saleTypeOptions}
								direction="horizontal"
								required
							/>
						</div>

						{/* Description */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Descrição (Opcional)
							</label>
							<textarea
								value={formData.description}
								onChange={(e) =>
									handleInputChange('description')(e.target.value)
								}
								placeholder="Descrição resumida do produto."
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
								rows={2}
								maxLength={150}
							/>

							<div className="flex justify-end mt-1">
								<span
									className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
										formData.description.length >= 140
											? 'bg-red-100 text-red-800'
											: 'bg-green-100 text-green-800'
									}`}
								>
									{formData.description.length} / 150
								</span>
							</div>
						</div>
					</div>
				);
			}

			if (activeSubTab === 'pricesStock') {
				// Calculate suggested price based on purchase price and markup
				const calculateSuggestedPrice = () => {
					const purchasePrice = parseFloat(formData.purchasePrice || '0');
					const markupPercent = parseFloat(formData.markup || '0');

					if (purchasePrice > 0) {
						if (markupPercent > 0) {
							// Use custom markup
							return purchasePrice * (1 + markupPercent / 100);
						} else {
							// Use a simple default calculation (50% markup)
							return purchasePrice * 1.5;
						}
					}
					return 0;
				};

				const suggestedPrice = calculateSuggestedPrice();

				const applySuggestedPrice = () => {
					if (suggestedPrice > 0) {
						setFormData((prev) => ({
							...prev,
							salePrice: suggestedPrice.toFixed(2),
						}));
					}
				};

				// Get API-based price suggestions if we have a product ID
				const getApiPriceSuggestions = async () => {
					if (editingProduct && formData.purchasePrice) {
						const purchasePrice = parseFloat(formData.purchasePrice);
						if (!isNaN(purchasePrice)) {
							getPriceSuggestions(purchasePrice);
						}
					}
				};

				return (
					<div className="space-y-6">
						{/* Prices Section */}
						<div>
							<h3 className="text-lg font-medium text-gray-900 mb-4">Preços</h3>
							<div className="grid grid-cols-3 md:grid-cols-3 gap-6">
								<Input
									label="Preço de Compra"
									type="number"
									step="0.01"
									value={formData.purchasePrice}
									onChange={handleInputChange('purchasePrice')}
									placeholder="0,00"
									min="0"
									required
								/>

								<Input
									label="Markup (%)"
									type="number"
									step="0.01"
									value={formData.markup}
									onChange={handleInputChange('markup')}
									placeholder="Ex: 50 (para 50%)"
									min="0"
								/>

								<div className="relative">
									<Input
										label="Preço de Venda"
										type="number"
										step="0.01"
										value={formData.salePrice}
										onChange={handleInputChange('salePrice')}
										placeholder="0,00"
										min="0"
										required
									/>
									{suggestedPrice > 0 && (
										<div className="mt-2">
											<button
												type="button"
												onClick={applySuggestedPrice}
												className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
											>
												Sugestão: R$ {suggestedPrice.toFixed(2)}
											</button>
										</div>
									)}

									{/* API Price Suggestions */}
									{editingProduct && (
										<div className="mt-2">
											<button
												type="button"
												onClick={getApiPriceSuggestions}
												disabled={isCalculating || !formData.purchasePrice}
												className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
											>
												{isCalculating
													? 'Calculando...'
													: 'Obter sugestões avançadas'}
											</button>
										</div>
									)}

									{priceSuggestions && (
										<div className="mt-3 p-3 bg-gray-50 rounded-lg">
											<h4 className="text-sm font-medium text-gray-700 mb-2">
												Sugestões de Preço:
											</h4>
											<div className="grid grid-cols-2 gap-2 text-xs">
												<button
													type="button"
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															salePrice:
																priceSuggestions.suggested?.toFixed(2) ||
																'0.00',
														}))
													}
													className="p-2 bg-green-100 text-green-800 rounded hover:bg-green-200"
												>
													Sugerido: R${' '}
													{priceSuggestions.suggested?.toFixed(2) || '0.00'}
												</button>
												<button
													type="button"
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															salePrice:
																priceSuggestions.competitive?.toFixed(2) ||
																'0.00',
														}))
													}
													className="p-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
												>
													Competitivo: R${' '}
													{priceSuggestions.competitive?.toFixed(2) || '0.00'}
												</button>
												<button
													type="button"
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															salePrice:
																priceSuggestions.premium?.toFixed(2) || '0.00',
														}))
													}
													className="p-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
												>
													Premium: R${' '}
													{priceSuggestions.premium?.toFixed(2) || '0.00'}
												</button>
												<button
													type="button"
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															salePrice:
																priceSuggestions.budget?.toFixed(2) || '0.00',
														}))
													}
													className="p-2 bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
												>
													Econômico: R${' '}
													{priceSuggestions.budget?.toFixed(2) || '0.00'}
												</button>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Stock Section */}
						<div>
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								Estoque
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Input
									label="Estoque Inicial"
									type="number"
									value={formData.stock}
									onChange={handleInputChange('stock')}
									placeholder="0"
									min="0"
									required
								/>
							</div>
						</div>
					</div>
				);
			}

			return null;
		};

		return (
			<div className="w-full">
				{/* Sub Tabs */}
				<div className="mb-6">
					<div className="border-b border-gray-200">
						<nav className="-mb-px flex space-x-8" aria-label="Sub Tabs">
							<button
								key="basic-subtab"
								type="button"
								onClick={() => setActiveSubTab('basic')}
								className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
									activeSubTab === 'basic'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								Informações Básicas
							</button>
							<button
								key="pricesStock-subtab"
								type="button"
								onClick={() => setActiveSubTab('pricesStock')}
								className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
									activeSubTab === 'pricesStock'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								Preços e Estoque
							</button>
						</nav>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-8">
					{/* Sub Tab Content */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						{renderSubTabContent()}
					</div>

					{/* Botões de Ação */}
					<div className="flex justify-end space-x-3">
						<Button
							type="button"
							variant="secondary"
							onClick={() => {
								setFormData({
									code: '',
									name: '',
									description: '',
									unit: 'un',
									stock: '',
									saleType: 'unit' as 'unit' | 'fractional',
									purchasePrice: '',
									markup: '',
									salePrice: '',
								});
								setEditingProduct(null);
								setActiveSubTab('basic');
							}}
						>
							{editingProduct ? 'Cancelar' : 'Limpar'}
						</Button>
						<Button
							type="submit"
							variant="primary"
							disabled={
								isLoading ||
								!formData.name ||
								!formData.purchasePrice ||
								!formData.salePrice
							}
						>
							{isLoading
								? 'Salvando...'
								: editingProduct
									? 'Atualizar Produto'
									: 'Cadastrar Produto'}
						</Button>
					</div>
				</form>
			</div>
		);
	};

	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
				<p className="text-gray-600 mt-1">
					{isAdmin
						? 'Gerencie todos os produtos do sistema'
						: hasPermission('modules.products')
							? `Cadastre e edite produtos - ${user?.name}`
							: 'Acesso limitado aos produtos'}
				</p>
				{isEmployee && !hasPermission('modules.products') && (
					<p className="text-sm text-red-600 mt-1">
						Você não tem permissão para acessar o módulo de produtos
					</p>
				)}
			</div>

			{/* Tabs */}
			{isAdmin || hasPermission('modules.products') ? (
				<div className="mb-6">
					<div className="border-b border-gray-200">
						<nav className="-mb-px flex space-x-8" aria-label="Tabs">
							<button
								key="list-tab"
								type="button"
								onClick={() => handleTabChange('list')}
								className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === 'list'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								Listagem
							</button>
							<button
								key="register-tab"
								type="button"
								onClick={() => handleTabChange('register')}
								className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === 'register'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								Cadastro
							</button>
						</nav>
					</div>
				</div>
			) : (
				<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-red-700 text-center">
						Você não tem permissão para acessar o módulo de produtos.
					</p>
					<p className="text-red-600 text-sm text-center mt-1">
						Entre em contato com o administrador para solicitar acesso.
					</p>
				</div>
			)}

			{/* Tab Content */}
			<div className="mt-6">{renderTabContent()}</div>
		</div>
	);
};

export default ProductsPage;
