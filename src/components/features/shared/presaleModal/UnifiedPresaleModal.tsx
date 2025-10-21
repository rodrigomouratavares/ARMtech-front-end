import { Package, Plus, Search, User, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useId, useMemo, useState } from 'react';
import paymentMethodService from '@/services/paymentMethodService';
import toastService from '../../../../services/ToastService';
import type {
	Customer,
	PaymentMethod,
	PreSale,
	PreSaleItem,
	Product,
} from '../../../../types';
import Button from '../../../common/Button';
import InPageModal from '../../../common/InPageModal';
import Select from '../../../common/Select';

interface UnifiedPresaleModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (
		presaleData: Omit<PreSale, 'id' | 'createdAt' | 'updatedAt'>,
	) => void;
	customers: Customer[];
	products: Product[];
	editingPresale?: PreSale | null;
	title?: string;
}

const UnifiedPresaleModal: React.FC<UnifiedPresaleModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	customers,
	products,
	editingPresale = null,
	title = 'Nova Pré-venda',
}) => {
	const formId = useId();
	const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

	// Form state
	const [formData, setFormData] = useState({
		customerId: '',
		paymentMethodId: '',
		notes: '',
		discount: '',
		discountType: 'percentage' as 'percentage' | 'fixed',
	});

	const [formItems, setFormItems] = useState<
		Omit<PreSaleItem, 'id' | 'totalPrice'>[]
	>([]);

	// New item form state
	const [newItemForm, setNewItemForm] = useState({
		productCode: '',
		productDescription: '',
		quantity: 1,
		unitPrice: 0,
		selectedProduct: null as Product | null,
	});

	// Dropdown states
	const [showProductDropdown, setShowProductDropdown] = useState(false);
	const [customerSearchTerm, setCustomerSearchTerm] = useState('');
	const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

	// Load payment methods on component mount
	useEffect(() => {
		const loadPaymentMethods = async () => {
			try {
				const data = await paymentMethodService.getAll();
				setPaymentMethods(Array.isArray(data) ? data : []);
			} catch (error) {
				console.error('Error loading payment methods:', error);
				setPaymentMethods([]); // Ensure it's always an array
				toastService.error('Erro ao carregar formas de pagamento');
			}
		};

		loadPaymentMethods();
	}, []);

	// Initialize form when editing
	useEffect(() => {
		if (editingPresale) {
			setFormData({
				customerId: editingPresale.customer.id,
				paymentMethodId: editingPresale.paymentMethodId || '1',
				notes: editingPresale.notes || '',
				discount: editingPresale.discount?.toString() || '',
				discountType: editingPresale.discountType || 'percentage',
			});

			setCustomerSearchTerm(editingPresale.customer.name);

			setFormItems(
				editingPresale.items.map((item) => ({
					product: item.product,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					notes: item.notes || '',
				})),
			);
		}
	}, [editingPresale]);

	// Select options - only show active payment methods
	const paymentMethodOptions = (paymentMethods || [])
		.filter((method) => method?.isActive)
		.map((method) => ({
			value: method.id,
			label: method.description,
		}));

	const discountTypeOptions = [
		{ value: 'percentage', label: 'Percentual (%)' },
		{ value: 'fixed', label: 'Valor Fixo (R$)' },
	];

	// Filter customers for search
	const filteredCustomers = useMemo(() => {
		if (!customerSearchTerm || !customers) return [];
		return customers.filter(
			(customer) =>
				customer?.name
					?.toLowerCase()
					?.includes(customerSearchTerm.toLowerCase()) ||
				customer?.email
					?.toLowerCase()
					?.includes(customerSearchTerm.toLowerCase()) ||
				customer?.cpf?.includes(customerSearchTerm),
		);
	}, [customers, customerSearchTerm]);

	// Filter products for dropdown
	const filteredProductsForDropdown = (products || []).filter(
		(product) =>
			product?.name
				?.toLowerCase()
				?.includes(newItemForm.productDescription.toLowerCase()) ||
			product?.code
				?.toLowerCase()
				?.includes(newItemForm.productDescription.toLowerCase()),
	);

	const handleInputChange = (field: string) => (value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	// Handle customer search
	const handleCustomerSearch = (searchTerm: string) => {
		setCustomerSearchTerm(searchTerm);
		setShowCustomerDropdown(searchTerm.length > 0);

		// Find matching customer
		const matchingCustomer = customers?.find(
			(customer) =>
				customer?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
				customer?.email?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
				customer?.cpf?.includes(searchTerm),
		);

		if (matchingCustomer) {
			setFormData((prev) => ({ ...prev, customerId: matchingCustomer.id }));
		} else {
			setFormData((prev) => ({ ...prev, customerId: '' }));
		}
	};

	// Handle customer selection from dropdown
	const handleCustomerSelect = (customer: Customer) => {
		setCustomerSearchTerm(customer.name);
		setFormData((prev) => ({ ...prev, customerId: customer.id }));
		setShowCustomerDropdown(false);
	};

	// Handle product description search and auto-fill code
	const handleProductDescriptionChange = (description: string) => {
		setNewItemForm((prev) => ({
			...prev,
			productDescription: description,
		}));

		// Show/hide dropdown based on input
		setShowProductDropdown(description.length > 0);

		// Find product by description
		const matchingProduct = products?.find(
			(product) =>
				product?.name?.toLowerCase()?.includes(description.toLowerCase()) ||
				product?.code?.toLowerCase()?.includes(description.toLowerCase()),
		);

		if (matchingProduct && description.length > 2) {
			const convertedProduct = {
				...matchingProduct,
				purchasePrice:
					typeof matchingProduct.purchasePrice === 'string'
						? Number(matchingProduct.purchasePrice)
						: matchingProduct.purchasePrice,
				salePrice:
					typeof matchingProduct.salePrice === 'string'
						? Number(matchingProduct.salePrice)
						: matchingProduct.salePrice,
				createdAt:
					typeof matchingProduct.createdAt === 'string'
						? new Date(matchingProduct.createdAt)
						: matchingProduct.createdAt,
				updatedAt:
					typeof matchingProduct.updatedAt === 'string'
						? new Date(matchingProduct.updatedAt)
						: matchingProduct.updatedAt,
			} as any;

			setNewItemForm((prev) => ({
				...prev,
				productCode: matchingProduct.code,
				unitPrice: convertedProduct.salePrice,
				selectedProduct: convertedProduct,
			}));
		} else if (!description) {
			// Clear fields when description is empty
			setNewItemForm((prev) => ({
				...prev,
				productCode: '',
				unitPrice: 0,
				selectedProduct: null,
			}));
		}
	};

	// Handle product selection from dropdown
	const handleProductSelect = (product: any) => {
		const convertedProduct = {
			...product,
			purchasePrice:
				typeof product.purchasePrice === 'string'
					? Number(product.purchasePrice)
					: product.purchasePrice,
			salePrice:
				typeof product.salePrice === 'string'
					? Number(product.salePrice)
					: product.salePrice,
			createdAt:
				typeof product.createdAt === 'string'
					? new Date(product.createdAt)
					: product.createdAt,
			updatedAt:
				typeof product.updatedAt === 'string'
					? new Date(product.updatedAt)
					: product.updatedAt,
		};

		setNewItemForm({
			productCode: product.code,
			productDescription: product.name,
			quantity: newItemForm.quantity,
			unitPrice: convertedProduct.salePrice,
			selectedProduct: convertedProduct,
		});
		setShowProductDropdown(false);
	};

	// Add item from the new inline form
	const handleAddItemFromForm = () => {
		if (!newItemForm.selectedProduct) {
			toastService.error('Selecione um produto válido!');
			return;
		}

		if (newItemForm.quantity <= 0) {
			toastService.error('Quantidade deve ser maior que zero!');
			return;
		}

		if (newItemForm.unitPrice <= 0) {
			toastService.error('Valor unitário deve ser maior que zero!');
			return;
		}

		// Check if product is already in the list
		const selectedProduct = newItemForm.selectedProduct;
		if (!selectedProduct) return;

		const existingItemIndex = formItems.findIndex(
			(item) => item.product.id === selectedProduct.id,
		);

		if (existingItemIndex >= 0) {
			// If product already exists, update quantity and price
			setFormItems((prev) =>
				prev.map((item, index) =>
					index === existingItemIndex
						? {
								...item,
								quantity: item.quantity + newItemForm.quantity,
								unitPrice: newItemForm.unitPrice,
							}
						: item,
				),
			);
			toastService.info(`"${selectedProduct.name}" atualizado na lista!`);
		} else {
			// Add new product to the list
			setFormItems((prev) => [
				...prev,
				{
					product: selectedProduct,
					quantity: newItemForm.quantity,
					unitPrice: newItemForm.unitPrice,
					notes: '',
				} as any,
			]);
			toastService.success(`"${selectedProduct.name}" adicionado aos itens!`);
		}

		// Clear the form
		setNewItemForm({
			productCode: '',
			productDescription: '',
			quantity: 1,
			unitPrice: 0,
			selectedProduct: null,
		});
	};

	const removeItemFromForm = (index: number) => {
		setFormItems((prev) => prev.filter((_, i) => i !== index));
	};

	const calculateItemTotal = (quantity: number, unitPrice: number) => {
		return quantity * unitPrice;
	};

	const calculateFormTotal = () => {
		const itemsTotal = formItems.reduce(
			(sum, item) => sum + calculateItemTotal(item.quantity, item.unitPrice),
			0,
		);
		const discountAmount =
			formData.discountType === 'percentage'
				? (itemsTotal * (Number(formData.discount) || 0)) / 100
				: Number(formData.discount) || 0;
		return itemsTotal - discountAmount;
	};

	const resetForm = () => {
		setFormData({
			customerId: '',
			paymentMethodId: '',
			notes: '',
			discount: '',
			discountType: 'percentage',
		});
		setFormItems([]);
		setNewItemForm({
			productCode: '',
			productDescription: '',
			quantity: 1,
			unitPrice: 0,
			selectedProduct: null,
		});
		setCustomerSearchTerm('');
		setShowCustomerDropdown(false);
		setShowProductDropdown(false);
	};

	const handleSubmitForm = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.customerId) {
			toastService.error('Selecione um cliente!');
			return;
		}

		if (!formData.paymentMethodId) {
			toastService.error('Selecione uma forma de pagamento!');
			return;
		}

		if (formItems.length === 0) {
			toastService.error('Adicione pelo menos um item à pré-venda!');
			return;
		}

		const selectedCustomer = customers?.find(
			(c) => c.id === formData.customerId,
		);
		if (!selectedCustomer) return;

		const presaleData: Omit<PreSale, 'id' | 'createdAt' | 'updatedAt'> = {
			customer: {
				...selectedCustomer,
				createdAt:
					typeof selectedCustomer.createdAt === 'string'
						? new Date(selectedCustomer.createdAt)
						: selectedCustomer.createdAt,
				updatedAt:
					typeof selectedCustomer.updatedAt === 'string'
						? new Date(selectedCustomer.updatedAt)
						: selectedCustomer.updatedAt,
			},
			items: formItems.map((item, index) => ({
				id: `item-${index}`,
				product: {
					...item.product,
					purchasePrice:
						typeof item.product.purchasePrice === 'string'
							? Number(item.product.purchasePrice)
							: item.product.purchasePrice,
					salePrice:
						typeof item.product.salePrice === 'string'
							? Number(item.product.salePrice)
							: item.product.salePrice,
				},
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				totalPrice: calculateItemTotal(item.quantity, item.unitPrice),
				discount: item.discount,
				notes: item.notes,
			})),
			total: calculateFormTotal(),
			status: editingPresale ? editingPresale.status : 'pending', // Sempre inicia como pending
			notes: formData.notes || undefined,
			discount: Number(formData.discount) || undefined,
			discountType: formData.discountType,
			paymentMethodId: formData.paymentMethodId,
			salesperson: editingPresale ? editingPresale.salesperson : 'Current User',
		};

		onSubmit(presaleData);
		resetForm();
		onClose();
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	if (!isOpen) return null;

	return (
		<InPageModal isOpen={isOpen} onClose={handleClose} title={title}>
			<div className="px-6 py-4">
				<form onSubmit={handleSubmitForm} className="space-y-6">
					{/* Cliente e Forma de Pagamento - Lado a lado */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Cliente */}
						<div className="relative">
							<label className="flex items-center text-sm font-medium text-gray-700 mb-2">
								<User className="h-4 w-4 mr-1" />
								Cliente *
							</label>
							<input
								type="text"
								value={customerSearchTerm}
								onChange={(e) => handleCustomerSearch(e.target.value)}
								onFocus={() =>
									setShowCustomerDropdown(customerSearchTerm.length > 0)
								}
								placeholder="Digite o nome, email ou CPF..."
								className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
							/>
							{/* Customer dropdown */}
							{showCustomerDropdown && (
								<div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
									{filteredCustomers.length === 0 ? (
										<div className="px-4 py-3 text-gray-500 text-center text-sm">
											{customerSearchTerm
												? 'Nenhum cliente encontrado'
												: 'Digite para buscar clientes'}
										</div>
									) : (
										filteredCustomers.map((customer) => (
											<button
												key={customer.id}
												type="button"
												onClick={() => handleCustomerSelect(customer)}
												className="w-full px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors text-left"
											>
												<div className="font-medium text-gray-900 text-sm">
													{customer.name}
												</div>
												<div className="text-xs text-gray-500">
													{customer.email} • {customer.cpf}
												</div>
											</button>
										))
									)}
								</div>
							)}
						</div>

						{/* Forma de Pagamento */}
						<div>
							<Select
								label="Forma de Pagamento *"
								value={formData.paymentMethodId}
								onChange={(value) =>
									handleInputChange('paymentMethodId')(value)
								}
								options={paymentMethodOptions}
								placeholder="Selecione a forma de pagamento"
								required
								size="sm"
							/>
						</div>
					</div>

					{/* Adicionar Produto */}
					<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
						<h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
							<Package className="h-4 w-4 mr-1" />
							Adicionar Produto
						</h3>

						{/* Busca de Produto */}
						<div className="mb-3">
							<div className="relative">
								<input
									type="text"
									value={newItemForm.productDescription}
									onChange={(e) =>
										handleProductDescriptionChange(e.target.value)
									}
									onFocus={() => setShowProductDropdown(true)}
									onBlur={() => {
										setTimeout(() => setShowProductDropdown(false), 150);
									}}
									placeholder="Digite o nome ou código do produto..."
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
								/>
								<Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />

								{/* Product Dropdown */}
								{showProductDropdown && (
									<div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
										{filteredProductsForDropdown.length > 0 ? (
											filteredProductsForDropdown.slice(0, 8).map((product) => (
												<button
													key={product.id}
													type="button"
													onMouseDown={() => handleProductSelect(product)}
													className="w-full p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center transition-colors text-left"
												>
													<div className="flex-1">
														<p className="font-medium text-gray-900 text-sm">
															{product.name}
														</p>
														<p className="text-xs text-gray-500">
															Código: {product.code}
														</p>
													</div>
													<div className="text-right ml-4">
														<p className="font-semibold text-blue-600 text-sm">
															R${' '}
															{product.salePrice
																? product.salePrice.toFixed(2)
																: '0.00'}
														</p>
														<p className="text-xs text-gray-500">
															Estoque: {product.stock}
														</p>
													</div>
												</button>
											))
										) : (
											<div className="p-4 text-gray-500 text-center text-sm">
												{newItemForm.productDescription
													? 'Nenhum produto encontrado'
													: 'Digite para buscar produtos'}
											</div>
										)}
									</div>
								)}
							</div>
						</div>

						{/* Detalhes do Produto */}
						<div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
							<div>
								<label className="block text-xs font-medium text-gray-600 mb-1">
									Código
								</label>
								<input
									type="text"
									value={newItemForm.productCode}
									readOnly
									placeholder="Auto"
									className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-gray-600 mb-1">
									Quantidade *
								</label>
								<input
									type="number"
									step="0.01"
									min="0.01"
									value={newItemForm.quantity}
									onChange={(e) =>
										setNewItemForm((prev) => ({
											...prev,
											quantity: Number(e.target.value),
										}))
									}
									className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-gray-600 mb-1">
									Valor Unit. *
								</label>
								<input
									type="number"
									step="0.01"
									min="0"
									value={newItemForm.unitPrice}
									onChange={(e) =>
										setNewItemForm((prev) => ({
											...prev,
											unitPrice: Number(e.target.value),
										}))
									}
									className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-gray-600 mb-1">
									Total
								</label>
								<div className="w-full px-2 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-right font-medium text-green-600">
									R$ {(newItemForm.quantity * newItemForm.unitPrice).toFixed(2)}
								</div>
							</div>

							<div>
								<Button
									type="button"
									variant="primary"
									onClick={handleAddItemFromForm}
									className="w-full h-[34px] flex items-center justify-center text-xs"
								>
									<Plus className="h-3 w-3 mr-1" />
									Adicionar
								</Button>
							</div>
						</div>
					</div>

					{/* Lista de Itens - Versão Compacta */}
					{formItems.length > 0 && (
						<div className="bg-white border border-gray-200 rounded-lg">
							<div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
								<h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
									<Package className="h-4 w-4 text-blue-600" />
									Itens Adicionados ({formItems.length})
								</h3>
								<div className="text-sm font-semibold text-green-600">
									Subtotal: R${' '}
									{formItems
										.reduce(
											(sum, item) =>
												sum + calculateItemTotal(item.quantity, item.unitPrice),
											0,
										)
										.toFixed(2)}
								</div>
							</div>
							<div className="divide-y divide-gray-200">
								{formItems.map((item, index) => (
									<div
										key={`item-${item.product.id}-${index}`}
										className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
									>
										<div className="flex items-center gap-3 flex-1 min-w-0">
											<div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
												<span className="text-xs font-semibold text-blue-600">
													{index + 1}
												</span>
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="font-medium text-gray-900 text-sm truncate">
													{item.product.name}
												</h4>
												<p className="text-xs text-gray-500">
													{item.product.code} • {item.quantity}{' '}
													{item.product.unit || 'un'} × R${' '}
													{item.unitPrice.toFixed(2)}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<div className="text-right">
												<p className="text-sm font-semibold text-green-600">
													R${' '}
													{calculateItemTotal(
														item.quantity,
														item.unitPrice,
													).toFixed(2)}
												</p>
											</div>
											<button
												type="button"
												onClick={() => removeItemFromForm(index)}
												className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
												title="Remover item"
											>
												<X className="h-4 w-4" />
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Desconto e Observações */}
					{formItems.length > 0 && (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Desconto
								</label>
								<input
									type="number"
									step="0.01"
									min="0"
									value={formData.discount}
									onChange={(e) =>
										handleInputChange('discount')(e.target.value)
									}
									placeholder="0.00"
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
								/>
							</div>

							<div>
								<Select
									label="Tipo de Desconto"
									value={formData.discountType}
									onChange={(value) => handleInputChange('discountType')(value)}
									options={discountTypeOptions}
									size="sm"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Observações
								</label>
								<input
									type="text"
									value={formData.notes}
									onChange={(e) => handleInputChange('notes')(e.target.value)}
									placeholder="Observações..."
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
								/>
							</div>
						</div>
					)}

					{/* Total */}
					{formItems.length > 0 && (
						<div className="bg-green-50 border border-green-200 rounded-lg p-4">
							<div className="flex justify-between items-center">
								<span className="text-lg font-medium text-gray-700">
									Total da Pré-venda:
								</span>
								<span className="text-2xl font-bold text-green-600">
									R$ {calculateFormTotal().toFixed(2)}
								</span>
							</div>
							{Number(formData.discount) > 0 && (
								<div className="text-sm text-gray-600 mt-2 text-right">
									Desconto aplicado: R${' '}
									{(formData.discountType === 'percentage'
										? (formItems.reduce(
												(sum, item) =>
													sum +
													calculateItemTotal(item.quantity, item.unitPrice),
												0,
											) *
												(Number(formData.discount) || 0)) /
											100
										: Number(formData.discount) || 0
									).toFixed(2)}
								</div>
							)}
						</div>
					)}

					{/* Actions */}
					<div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
						<Button
							type="button"
							variant="secondary"
							onClick={handleClose}
							className="px-6 py-2"
						>
							Cancelar
						</Button>
						<Button
							id={`${formId}-submit-presale-button`}
							type="submit"
							variant="primary"
							className="px-6 py-2"
						>
							{editingPresale ? 'Atualizar Pré-venda' : 'Criar Pré-venda'}
						</Button>
					</div>
				</form>
			</div>
		</InPageModal>
	);
};

export default UnifiedPresaleModal;
