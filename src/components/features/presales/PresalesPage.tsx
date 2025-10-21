import jsPDF from 'jspdf';
import {
	Calculator,
	Calendar,
	CheckCircle,
	Clock,
	Download,
	Edit,
	Eye,
	FileText,
	Plus,
	RotateCcw,
	Search,
	Sparkles,
	Trash2,
	X,
	XCircle,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../hooks/useCustomers';
import { usePresales } from '../../../hooks/usePresales';
import { useProducts } from '../../../hooks/useProducts';
import toastService, { TOAST_MESSAGES } from '../../../services/ToastService';
import type { PreSale, PreSaleItem } from '../../../types';
import type { PreSale as ApiPreSale } from '../../../types/api';
import Button from '../../common/Button';
import InPageModal from '../../common/InPageModal';
import Select from '../../common/Select';
import SimpleModal from '../../common/SimpleModal';
import { UnifiedPresaleModal } from '../shared/presaleModal';
import PreSaleItemsDisplay from './PreSaleItemsDisplay';

const PresalesPage: React.FC = () => {
	const { isAdmin, isEmployee, user, hasPermission } = useAuth();

	const [searchTerm, setSearchTerm] = useState('');
	const [selectedPreSale, setSelectedPreSale] = useState<PreSale | null>(null);
	const [showViewModal, setShowViewModal] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showStatusModal, setShowStatusModal] = useState(false);
	const [showPdfConfirmModal, setShowPdfConfirmModal] = useState(false);
	const [pendingConversion, setPendingConversion] = useState<PreSale | null>(
		null,
	);
	const [statusFilter, setStatusFilter] = useState<PreSale['status'] | 'all'>(
		'all',
	);
	// Initialize date filters to show all presales by default
	// Use local date to avoid timezone issues
	const getLocalDateString = (date: Date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};
	const today = getLocalDateString(new Date());
	const [startDate, setStartDate] = useState(''); // Mostrar todas as datas por padrão
	const [endDate, setEndDate] = useState(''); // Mostrar todas as datas por padrão

	// Carregar dados reais do banco de dados
	const { customers, error: customersError } = useCustomers({
		page: 1,
		limit: 100,
	});

	const { products, error: productsError } = useProducts({
		page: 1,
		limit: 100,
	});

	// Carregar pré-vendas reais do banco de dados
	const {
		presales,
		loading: presalesLoading,
		error: presalesError,
		createPresale: createPresaleAPI,
		updatePresale: updatePresaleAPI,
		deletePresale,
		updatePresaleStatus,
		refreshPresales,
	} = usePresales({ autoFetch: true });

	// Converter pré-vendas da API para o formato local com verificações de segurança
	const convertApiPresaleToLocal = useCallback(
		(apiPresale: ApiPreSale): PreSale | null => {
			try {
				console.log('Converting API presale:', apiPresale);

				// Verificar se os dados essenciais existem
				if (!apiPresale || !apiPresale.id) {
					console.warn('Pré-venda inválida:', apiPresale);
					return null;
				}

				// Verificar se o customer existe e tem dados válidos
				if (
					!apiPresale.customer ||
					!apiPresale.customer.id ||
					!apiPresale.customer.name
				) {
					console.warn(
						'Pré-venda sem customer válido:',
						apiPresale.id,
						apiPresale.customer,
					);
					return null;
				}

				return {
					id: apiPresale.id,
					customer: {
						id: apiPresale.customer.id,
						name: apiPresale.customer.name,
						email: apiPresale.customer.email,
						phone: apiPresale.customer.phone || '',
						cpf: apiPresale.customer.cpf,
						address: apiPresale.customer.address || '',
						createdAt: apiPresale.customer.createdAt
							? new Date(apiPresale.customer.createdAt)
							: new Date(),
						updatedAt: apiPresale.customer.updatedAt
							? new Date(apiPresale.customer.updatedAt)
							: new Date(),
					},
					items: (apiPresale.items || [])
						.map((item) => {
							if (!item || !item.product) {
								console.warn('Item sem produto na pré-venda:', apiPresale.id);
								return null;
							}

							return {
								id: item.id || 'temp-id',
								product: {
									id: item.product.id,
									code: item.product.code,
									name: item.product.name,
									unit: item.product.unit,
									description: item.product.description || '',
									stock: item.product.stock || 0,
									purchasePrice:
										typeof item.product.purchasePrice === 'string'
											? Number(item.product.purchasePrice)
											: item.product.purchasePrice || 0,
									salePrice:
										typeof item.product.salePrice === 'string'
											? Number(item.product.salePrice)
											: item.product.salePrice || 0,
									saleType:
										(item.product.saleType as 'unit' | 'fractional') || 'unit',
									createdAt: item.product.createdAt
										? new Date(item.product.createdAt)
										: new Date(),
									updatedAt: item.product.updatedAt
										? new Date(item.product.updatedAt)
										: new Date(),
								},
								quantity: Number(item.quantity) || 0,
								unitPrice: Number(item.unitPrice) || 0,
								totalPrice: Number(item.totalPrice) || 0,
								discount: item.discount ? Number(item.discount) : undefined,
							};
						})
						.filter(Boolean) as PreSaleItem[], // Remove itens nulos
					total: Number(apiPresale.total) || 0,
					status: apiPresale.status || 'draft',
					notes: apiPresale.notes,
					discount: apiPresale.discount
						? Number(apiPresale.discount)
						: undefined,
					discountType: apiPresale.discountType || 'percentage',
					salesperson: 'Sistema', // Não vem da API, valor padrão
					salespersonId: '1', // Não vem da API, valor padrão
					createdAt: apiPresale.createdAt
						? new Date(apiPresale.createdAt)
						: new Date(),
					updatedAt: apiPresale.updatedAt
						? new Date(apiPresale.updatedAt)
						: new Date(),
				};
			} catch (error) {
				console.error('Erro ao converter pré-venda da API:', error, apiPresale);
				return null;
			}
		},
		[],
	);

	// Usar as pré-vendas reais convertidas, filtrando as que falharam na conversão
	const preSales = useMemo(() => {
		// Garantir que presales seja sempre um array
		const presalesArray = Array.isArray(presales) ? presales : [];
		console.log('PresalesPage - Converting presales:', {
			rawPresales: presales,
			presalesArrayLength: presalesArray.length,
			firstPresale: presalesArray[0],
		});

		const converted = presalesArray
			.map(convertApiPresaleToLocal)
			.filter(Boolean) as PreSale[];

		console.log('PresalesPage - Converted presales:', {
			convertedLength: converted.length,
			firstConverted: converted[0],
		});

		return converted;
	}, [presales]);

	// Os hooks useCustomers e useProducts já fazem o fetch automaticamente
	// Não precisamos chamar fetchCustomers e fetchProducts novamente

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

	useEffect(() => {
		if (presalesError) {
			console.error('Erro ao carregar pré-vendas:', presalesError);
			toastService.error('Erro ao carregar pré-vendas: ' + presalesError);
		}
	}, [presalesError]);

	// Converter dados da API para o formato esperado pelo modal
	const convertCustomersForModal = (apiCustomers: any[] | undefined) => {
		if (!apiCustomers) return [];
		return apiCustomers.map((customer) => ({
			...customer,
			createdAt:
				typeof customer.createdAt === 'string'
					? new Date(customer.createdAt)
					: customer.createdAt,
			updatedAt:
				typeof customer.updatedAt === 'string'
					? new Date(customer.updatedAt)
					: customer.updatedAt,
		}));
	};

	const convertProductsForModal = (apiProducts: any[] | undefined) => {
		if (!apiProducts) return [];
		return apiProducts.map((product) => ({
			...product,
			purchasePrice:
				typeof product.purchasePrice === 'string'
					? Number(product.purchasePrice)
					: product.purchasePrice,
			salePrice:
				typeof product.salePrice === 'string'
					? Number(product.salePrice)
					: product.salePrice,
			saleType: product.saleType as 'unit' | 'fractional',
			createdAt:
				typeof product.createdAt === 'string'
					? new Date(product.createdAt)
					: product.createdAt,
			updatedAt:
				typeof product.updatedAt === 'string'
					? new Date(product.updatedAt)
					: product.updatedAt,
		}));
	};

	// Select options
	const statusOptions = [
		{ value: 'all', label: 'Todos os Status' },
		{ value: 'draft', label: 'Rascunho' },
		{ value: 'pending', label: 'Pendente' },
		{ value: 'approved', label: 'Aprovada' },
		{ value: 'cancelled', label: 'Cancelada' },
		{ value: 'converted', label: 'Convertida' },
	];

	const getStatusLabel = (status: PreSale['status']) => {
		const statusLabels = {
			draft: 'Rascunho',
			pending: 'Pendente',
			approved: 'Aprovada',
			cancelled: 'Cancelada',
			converted: 'Convertida',
		};
		return statusLabels[status];
	};

	const getStatusColor = (status: PreSale['status']) => {
		const statusColors = {
			draft: 'bg-gray-100 text-gray-800',
			pending: 'bg-yellow-100 text-yellow-800',
			approved: 'bg-green-100 text-green-800',
			cancelled: 'bg-red-100 text-red-800',
			converted: 'bg-blue-100 text-blue-800',
		};
		return statusColors[status];
	};

	const filteredPreSales = preSales.filter((preSale) => {
		// Verificações de segurança
		if (!preSale || !preSale.customer) {
			return false;
		}

		const matchesSearch =
			preSale.customer.name
				?.toLowerCase()
				?.includes(searchTerm.toLowerCase()) ||
			preSale.id?.toLowerCase()?.includes(searchTerm.toLowerCase());
		const matchesStatus =
			statusFilter === 'all' || preSale.status === statusFilter;

		// Date filtering - usando string comparison para evitar problemas de fuso horário
		let matchesDateRange = true;
		if (startDate || endDate) {
			// Converte a data da pré-venda para string no formato YYYY-MM-DD usando timezone local
			const presaleDate = new Date(preSale.createdAt);
			const presaleDateString = getLocalDateString(presaleDate);

			if (startDate) {
				matchesDateRange = matchesDateRange && presaleDateString >= startDate;
			}

			if (endDate) {
				matchesDateRange = matchesDateRange && presaleDateString <= endDate;
			}
		}

		// Permission-based filtering
		let hasPermissionToView = true;

		if (isEmployee) {
			// Employees can only see their own presales unless they have canViewAll permission
			if (hasPermission('presales.canViewAll')) {
				hasPermissionToView = true; // Can see all presales
			} else if (hasPermission('presales.canViewOwn')) {
				hasPermissionToView = preSale.salespersonId === user?.id; // Only own presales
			} else {
				hasPermissionToView = false; // No permission to view presales
			}
		}
		// Admins can see all presales by default

		return (
			matchesSearch && matchesStatus && matchesDateRange && hasPermissionToView
		);
	});

	const handleViewPreSale = (preSale: PreSale) => {
		setSelectedPreSale(preSale);
		setShowViewModal(true);
	};

	const handleDeletePreSale = async (id: string) => {
		if (confirm(TOAST_MESSAGES.presale.deleteConfirm)) {
			try {
				const success = await deletePresale(id);
				if (success) {
					toastService.success(TOAST_MESSAGES.presale.deleted);
					await refreshPresales();
				} else {
					toastService.error('Erro ao excluir pré-venda.');
				}
			} catch (error) {
				console.error('Erro ao excluir pré-venda:', error);
				toastService.error('Erro ao excluir pré-venda. Tente novamente.');
			}
		}
	};

	const handleEditPreSale = (preSale: PreSale) => {
		setSelectedPreSale(preSale);
		setShowEditModal(true);
	};

	const handleStatusChange = (preSale: PreSale) => {
		setSelectedPreSale(preSale);
		setShowStatusModal(true);
	};

	const updatePreSaleStatusLocal = async (newStatus: PreSale['status']) => {
		if (!selectedPreSale) return;

		// Se está convertendo para "converted", mostrar modal de confirmação de PDF
		if (newStatus === 'converted') {
			setPendingConversion(selectedPreSale);
			setShowStatusModal(false);
			setShowPdfConfirmModal(true);
			return;
		}

		try {
			const updatedPresale = await updatePresaleStatus(
				selectedPreSale.id,
				newStatus,
			);
			if (updatedPresale) {
				toastService.success(
					`Status da pré-venda alterado para ${getStatusLabel(newStatus)}`,
				);
				await refreshPresales();
			} else {
				toastService.error('Erro ao atualizar status da pré-venda.');
			}
		} catch (error) {
			console.error('Erro ao atualizar status:', error);
			toastService.error('Erro ao atualizar status. Tente novamente.');
		}

		setShowStatusModal(false);
		setSelectedPreSale(null);
	};

	const handleConvertWithPdf = async (generatePdf: boolean) => {
		if (!pendingConversion) return;

		try {
			const updatedPresale = await updatePresaleStatus(
				pendingConversion.id,
				'converted',
			);
			if (updatedPresale) {
				toastService.success('Pré-venda convertida com sucesso!');

				if (generatePdf) {
					handleGeneratePDF(pendingConversion);
				}

				await refreshPresales();
			} else {
				toastService.error('Erro ao converter pré-venda.');
			}
		} catch (error) {
			console.error('Erro ao converter pré-venda:', error);
			toastService.error('Erro ao converter pré-venda. Tente novamente.');
		}

		setShowPdfConfirmModal(false);
		setPendingConversion(null);
		setSelectedPreSale(null);
	};

	// Clear date filters to show all dates
	const clearDateFilters = () => {
		setStartDate('');
		setEndDate('');
	};

	// Reset to today's filter
	const resetToToday = () => {
		const todayDate = getLocalDateString(new Date());
		setStartDate(todayDate);
		setEndDate(todayDate);
	};

	// Generate PDF function using jsPDF
	const handleGeneratePDF = (preSale: PreSale) => {
		try {
			// Validar dados antes de gerar PDF
			if (
				!preSale ||
				!preSale.customer ||
				!preSale.items ||
				preSale.items.length === 0
			) {
				toastService.error('Dados da pré-venda incompletos para gerar PDF.');
				return;
			}

			toastService.info('Gerando PDF da pré-venda...');

			const doc = new jsPDF();

			// Header
			doc.setFontSize(20);
			doc.text(`PRÉ-VENDA #${preSale.id}`, 20, 20);

			// Customer info
			doc.setFontSize(12);
			doc.text('DADOS DO CLIENTE', 20, 40);
			doc.setFontSize(10);
			doc.text(`Nome: ${preSale.customer.name}`, 20, 50);
			doc.text(`Email: ${preSale.customer.email}`, 20, 55);
			doc.text(`CPF: ${preSale.customer.cpf}`, 20, 60);
			doc.text(`Telefone: ${preSale.customer.phone}`, 20, 65);

			// Pre-sale info
			doc.setFontSize(12);
			doc.text('INFORMAÇÕES DA PRÉ-VENDA', 20, 80);
			doc.setFontSize(10);
			doc.text(
				`Data: ${preSale.createdAt.toLocaleDateString('pt-BR')}`,
				20,
				90,
			);
			doc.text(`Status: ${getStatusLabel(preSale.status)}`, 20, 95);

			// Items section - Manual table
			doc.setFontSize(12);
			doc.text('ITENS DA PRÉ-VENDA', 20, 105);

			// Table header
			doc.setFontSize(9);
			doc.setFont('helvetica', 'bold');
			doc.text('#', 20, 115);
			doc.text('Produto', 30, 115);
			doc.text('Código', 90, 115);
			doc.text('Qtd', 130, 115);
			doc.text('Valor Unit.', 150, 115);
			doc.text('Total', 180, 115);

			// Draw header line
			doc.line(20, 117, 200, 117);

			// Table rows
			doc.setFont('helvetica', 'normal');
			let currentY = 125;

			preSale.items.forEach((item, index) => {
				if (currentY > 270) {
					// New page if needed
					doc.addPage();
					currentY = 20;
				}

				doc.text(`${index + 1}`, 20, currentY);
				doc.text(item.product.name.substring(0, 25), 30, currentY); // Limit text length
				doc.text(item.product.code, 90, currentY);
				doc.text(`${item.quantity}`, 130, currentY);
				doc.text(`R$ ${item.unitPrice.toFixed(2)}`, 150, currentY);
				doc.text(`R$ ${item.totalPrice.toFixed(2)}`, 180, currentY);

				currentY += 8;
			});

			// Draw bottom line
			doc.line(20, currentY, 200, currentY);

			// Total section
			const finalY = currentY + 10;
			doc.setFontSize(12);
			if (preSale.discount) {
				doc.text(`Desconto: R$ ${preSale.discount.toFixed(2)}`, 20, finalY);
			}
			doc.setFontSize(14);
			doc.text(`TOTAL: R$ ${preSale.total.toFixed(2)}`, 20, finalY + 10);

			// Notes
			if (preSale.notes) {
				doc.setFontSize(10);
				doc.text('Observações:', 20, finalY + 25);
				doc.text(preSale.notes, 20, finalY + 30);
			}

			// Save PDF
			doc.save(`presale-${preSale.id}.pdf`);
			toastService.success('PDF gerado com sucesso! 📄');
		} catch (error) {
			console.error('Erro ao gerar PDF:', error);
			toastService.error('Erro ao gerar PDF. Tente novamente.');
		}
	};

	const handleCreatePresale = async (
		presaleData: Omit<PreSale, 'id' | 'createdAt' | 'updatedAt'>,
	) => {
		try {
			// Converter dados do modal para o formato da API
			const apiPresaleData = {
				customerId: presaleData.customer.id,
				status: 'pending' as const, // Sempre inicia como pending
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

			// Usar o hook para criar a pré-venda
			const createdPresale = await createPresaleAPI(apiPresaleData);

			if (createdPresale) {
				toastService.success(TOAST_MESSAGES.presale.created);
				// Recarregar a lista de pré-vendas para mostrar a nova
				await refreshPresales();
			} else {
				toastService.error('Erro ao criar pré-venda. Tente novamente.');
			}
		} catch (error) {
			console.error('Erro ao criar pré-venda:', error);
			toastService.error('Erro ao criar pré-venda. Tente novamente.');
		}
	};

	const handleUpdatePresale = async (
		presaleData: Omit<PreSale, 'id' | 'createdAt' | 'updatedAt'>,
	) => {
		if (!selectedPreSale) return;

		try {
			// Converter dados para o formato da API
			const apiPresaleData = {
				customerId: presaleData.customer.id,
				status: presaleData.status,
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

			const updatedPresale = await updatePresaleAPI(
				selectedPreSale.id,
				apiPresaleData,
			);

			if (updatedPresale) {
				toastService.success(TOAST_MESSAGES.presale.updated);
				await refreshPresales();
			} else {
				toastService.error('Erro ao atualizar pré-venda.');
			}
		} catch (error) {
			console.error('Erro ao atualizar pré-venda:', error);
			toastService.error('Erro ao atualizar pré-venda. Tente novamente.');
		}

		setSelectedPreSale(null);
		setShowEditModal(false);
	};

	const renderTabContent = () => {
		return (
			<div className="space-y-6">
				{/* Search Bar and Filters */}
				<div className="presales-filters space-y-4">
					{/* First row - Search and Status */}
					<div className="presales-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
							<div className="presales-search relative flex-1 sm:max-w-md">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<input
									type="text"
									placeholder="Buscar por cliente ou ID..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
								/>
							</div>
							<Select
								value={statusFilter}
								onChange={(value) =>
									setStatusFilter(value as PreSale['status'] | 'all')
								}
								options={statusOptions}
								size="sm"
								className="w-full sm:w-48"
							/>
						</div>
						<Button
							variant="primary"
							onClick={() => setShowCreateModal(true)}
							className="flex items-center justify-center space-x-2 w-full sm:w-auto py-3 sm:py-2"
						>
							<Plus className="h-4 w-4" />
							<span>Nova Pré-venda</span>
						</Button>
					</div>

					{/* Second row - Date filters */}
					<div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
							<div className="flex items-center gap-2 text-sm font-medium text-gray-700">
								<Calendar className="h-4 w-4" />
								<span>Filtros por Data de Abertura</span>
							</div>
							{/* Quick filter buttons */}
							<div className="presales-quick-filters flex items-center gap-2">
								<button
									type="button"
									onClick={resetToToday}
									className={`px-3 py-2 sm:py-1 text-xs rounded-full font-medium transition-colors ${
										startDate === today && endDate === today
											? 'bg-blue-600 text-white'
											: 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
									}`}
								>
									Hoje
								</button>
								<button
									type="button"
									onClick={clearDateFilters}
									className={`px-3 py-2 sm:py-1 text-xs rounded-full font-medium transition-colors ${
										!startDate && !endDate
											? 'bg-blue-600 text-white'
											: 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
									}`}
								>
									Todas as Datas
								</button>
							</div>
						</div>

						{/* Date range inputs */}
						<div className="presales-date-filters flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
							<div className="flex items-center gap-2 flex-1">
								<label
									htmlFor="startDate"
									className="text-sm text-gray-600 min-w-[2rem] flex-shrink-0"
								>
									De:
								</label>
								<input
									id="startDate"
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
								/>
							</div>
							<div className="flex items-center gap-2 flex-1">
								<label
									htmlFor="endDate"
									className="text-sm text-gray-600 min-w-[2.5rem] flex-shrink-0"
								>
									Até:
								</label>
								<input
									id="endDate"
									type="date"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
								/>
							</div>

							{/* Current filter status */}
							<div className="text-xs text-gray-500 ml-auto">
								{!startDate && !endDate && 'Mostrando todas as datas'}
								{startDate &&
									endDate &&
									startDate === endDate &&
									startDate === today &&
									'Mostrando apenas hoje'}
								{startDate &&
									endDate &&
									startDate === endDate &&
									startDate !== today &&
									`Mostrando apenas ${new Date(startDate).toLocaleDateString('pt-BR')}`}
								{startDate &&
									endDate &&
									startDate !== endDate &&
									`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`}
								{startDate &&
									!endDate &&
									`A partir de ${new Date(startDate).toLocaleDateString('pt-BR')}`}
								{!startDate &&
									endDate &&
									`Até ${new Date(endDate).toLocaleDateString('pt-BR')}`}
							</div>
						</div>
					</div>
				</div>

				{/* Pre-sales List */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-gray-800">Pré-vendas</h2>
						<span className="text-sm text-gray-500">
							{filteredPreSales.length} pré-vendas encontradas
						</span>
					</div>

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{filteredPreSales.map((preSale) => (
							<div
								key={preSale.id}
								className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
							>
								<div className="flex justify-between items-start mb-3">
									<div>
										<h3 className="font-semibold text-gray-900">
											#{preSale.id}
										</h3>
										<p className="text-sm text-gray-600">
											{preSale.customer.name}
										</p>
										<p className="text-xs text-gray-500">
											{preSale.customer.email}
										</p>
									</div>
									<span
										className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(preSale.status)}`}
									>
										{getStatusLabel(preSale.status)}
									</span>
								</div>

								<div className="mb-3">
									<div className="flex justify-between items-center">
										<span className="text-sm text-gray-600">Total:</span>
										<span className="text-lg font-bold text-green-600">
											R$ {preSale.total.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between items-center mt-1">
										<span className="text-sm text-gray-600">Itens:</span>
										<span className="text-sm font-medium text-gray-700">
											{preSale.items.length}
										</span>
									</div>
								</div>

								<div className="flex justify-between items-center pt-3 border-t border-gray-200">
									<div className="flex items-center space-x-2 text-xs text-gray-500">
										<span>{preSale.createdAt.toLocaleDateString('pt-BR')}</span>
										{preSale.salesperson && (
											<>
												<span>•</span>
												<span>{preSale.salesperson}</span>
											</>
										)}
									</div>
									<div className="mobile-action-buttons flex flex-wrap gap-1 justify-end sm:justify-start">
										{/* View button - always available if user can see the presale */}
										<button
											type="button"
											onClick={() => handleViewPreSale(preSale)}
											className="p-2 sm:p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
											title="Visualizar"
										>
											<Eye className="h-4 w-4" />
										</button>

										{/* Edit button - only for own presales (employees) or all presales (admins) */}
										{(preSale.status === 'draft' ||
											preSale.status === 'pending') &&
											(isAdmin ||
												(isEmployee && preSale.salespersonId === user?.id)) && (
												<button
													type="button"
													onClick={() => handleEditPreSale(preSale)}
													className="p-2 sm:p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
													title="Editar"
												>
													<Edit className="h-4 w-4" />
												</button>
											)}

										{/* Status change button - only for admins or own presales */}
										{(isAdmin ||
											(isEmployee && preSale.salespersonId === user?.id)) && (
											<button
												type="button"
												onClick={() => handleStatusChange(preSale)}
												className="p-2 sm:p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded transition-colors"
												title="Alterar Status"
											>
												<RotateCcw className="h-4 w-4" />
											</button>
										)}

										{/* Delete button - only for admins or own presales (and not converted) */}
										{preSale.status !== 'converted' &&
											(isAdmin ||
												(isEmployee && preSale.salespersonId === user?.id)) && (
												<button
													type="button"
													onClick={() => handleDeletePreSale(preSale.id)}
													className="p-2 sm:p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
													title="Excluir"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											)}
									</div>
								</div>
							</div>
						))}
					</div>

					{presalesLoading ? (
						<div className="text-center py-12">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
							<p className="text-gray-500 text-lg">Carregando pré-vendas...</p>
						</div>
					) : (
						filteredPreSales.length === 0 && (
							<div className="text-center py-12">
								<Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
								<p className="text-gray-500 text-lg">
									{searchTerm
										? 'Nenhuma pré-venda encontrada'
										: isEmployee &&
												!hasPermission('presales.canViewOwn') &&
												!hasPermission('presales.canViewAll')
											? 'Você não tem permissão para visualizar pré-vendas'
											: isEmployee &&
													hasPermission('presales.canViewOwn') &&
													!hasPermission('presales.canViewAll')
												? 'Você ainda não criou nenhuma pré-venda'
												: 'Nenhuma pré-venda cadastrada ainda.'}
								</p>
								{!searchTerm &&
									(isAdmin || hasPermission('presales.canCreate')) && (
										<Button
											variant="primary"
											onClick={() => setShowCreateModal(true)}
											className="mt-4"
										>
											{isEmployee &&
											hasPermission('presales.canViewOwn') &&
											!hasPermission('presales.canViewAll')
												? 'Criar sua primeira pré-venda'
												: 'Criar primeira pré-venda'}
										</Button>
									)}
								{isEmployee &&
									!hasPermission('presales.canViewOwn') &&
									!hasPermission('presales.canViewAll') && (
										<p className="text-sm text-gray-400 mt-4">
											Entre em contato com o administrador para solicitar
											permissões de acesso.
										</p>
									)}
							</div>
						)
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Pré-vendas</h1>
				<p className="text-gray-600 mt-1">
					{isAdmin
						? 'Gerencie todas as pré-vendas do sistema'
						: isEmployee && hasPermission('presales.canViewAll')
							? 'Visualize todas as pré-vendas da empresa'
							: isEmployee && hasPermission('presales.canViewOwn')
								? `Suas pré-vendas - ${user?.name}`
								: 'Acesso limitado às pré-vendas'}
				</p>
				{isEmployee && !hasPermission('presales.canViewAll') && (
					<p className="text-sm text-blue-600 mt-1">
						Funcionário •{' '}
						{hasPermission('presales.canViewOwn')
							? 'Visualizando apenas suas pré-vendas'
							: 'Sem permissão para visualizar pré-vendas'}
					</p>
				)}
			</div>

			{/* Tab Content */}
			<div className="mt-6">{renderTabContent()}</div>

			{/* View Pre-sale Modal - Modern Design */}
			{showViewModal && selectedPreSale && (
				<InPageModal
					isOpen={showViewModal}
					onClose={() => setShowViewModal(false)}
					title={`Pré-venda #${selectedPreSale.id}`}
				>
					<div className="p-6 space-y-6">
						{/* Header com informações e ações */}
						<div className="flex items-center justify-between pb-4 border-b border-gray-200">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-100 rounded-lg">
									<Eye className="h-5 w-5 text-blue-600" />
								</div>
								<div>
									<p className="text-sm text-gray-500">
										Criada em{' '}
										{selectedPreSale.createdAt.toLocaleDateString('pt-BR')}
									</p>
								</div>
							</div>
							<Button
								variant="primary"
								size="sm"
								onClick={() => handleGeneratePDF(selectedPreSale)}
								className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
							>
								<Download className="h-4 w-4" />
								<span>Gerar PDF</span>
							</Button>
						</div>
						{/* Cliente */}
						<section className="bg-blue-50 rounded-lg p-4 border border-blue-100">
							<h3 className="text-sm font-medium text-blue-900 mb-3">
								Cliente
							</h3>
							<dl className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<dt className="text-blue-700">Nome:</dt>
									<dd className="font-semibold text-blue-900">
										{selectedPreSale.customer.name}
									</dd>
								</div>
								<div>
									<dt className="text-blue-700">Email:</dt>
									<dd className="font-medium text-blue-900">
										{selectedPreSale.customer.email}
									</dd>
								</div>
								<div>
									<dt className="text-blue-700">Telefone:</dt>
									<dd className="font-medium text-blue-900">
										{selectedPreSale.customer.phone}
									</dd>
								</div>
								<div>
									<dt className="text-blue-700">CPF:</dt>
									<dd className="font-mono font-medium text-blue-900">
										{selectedPreSale.customer.cpf}
									</dd>
								</div>
							</dl>
						</section>

						{/* Itens */}
						<section>
							<h3 className="text-sm font-medium text-gray-900 mb-3">Itens</h3>
							<PreSaleItemsDisplay items={selectedPreSale.items as any} />
						</section>

						{/* Total */}
						<section className="bg-gray-50 p-4 rounded-lg space-y-3">
							<div className="flex justify-between items-center">
								<span className="text-lg font-medium">Total Geral:</span>
								<span className="text-xl font-bold text-green-600">
									R$ {selectedPreSale.total.toFixed(2)}
								</span>
							</div>

							<div className="text-sm text-gray-600 space-y-1">
								<div className="flex justify-between">
									<span>Status:</span>
									<span
										className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
											selectedPreSale.status,
										)}`}
									>
										{getStatusLabel(selectedPreSale.status)}
									</span>
								</div>
							</div>

							{selectedPreSale.notes && (
								<div className="pt-3 border-t border-gray-200">
									<span className="text-sm text-gray-600">Observações:</span>
									<p className="text-sm mt-1">{selectedPreSale.notes}</p>
								</div>
							)}
						</section>
					</div>
				</InPageModal>
			)}
			{/* Create Pre-sale Modal */}
			{customers && products && (
				<UnifiedPresaleModal
					isOpen={showCreateModal}
					onClose={() => setShowCreateModal(false)}
					onSubmit={handleCreatePresale}
					customers={convertCustomersForModal(customers) as any}
					products={convertProductsForModal(products) as any}
					title="Nova Pré-venda"
				/>
			)}

			{/* Edit Pre-sale Modal */}
			{showEditModal && selectedPreSale && customers && products && (
				<UnifiedPresaleModal
					isOpen={showEditModal}
					onClose={() => {
						setShowEditModal(false);
						setSelectedPreSale(null);
					}}
					onSubmit={handleUpdatePresale}
					customers={convertCustomersForModal(customers) as any}
					products={convertProductsForModal(products) as any}
					editingPresale={selectedPreSale}
					title={`Editar Pré-venda #${selectedPreSale.id}`}
				/>
			)}

			{/* Status Change Modal - Compact Design */}
			{showStatusModal && selectedPreSale && (
				<SimpleModal
					isOpen={showStatusModal}
					onClose={() => setShowStatusModal(false)}
					title="Alterar Status"
				>
					<div className="space-y-4">
						{/* Header compacto */}
						<div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
							<RotateCcw className="h-5 w-5 text-blue-600" />
							<div className="flex-1">
								<p className="font-medium text-gray-900">
									#{selectedPreSale.id} - {selectedPreSale.customer.name}
								</p>
								<p className="text-sm text-gray-600">
									R$ {selectedPreSale.total.toFixed(2)}
								</p>
							</div>
							<span
								className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedPreSale.status)}`}
							>
								{getStatusLabel(selectedPreSale.status)}
							</span>
						</div>

						{/* Opções de Status - Grid compacto */}
						<div className="grid grid-cols-2 gap-2">
							{(
								[
									'draft',
									'pending',
									'approved',
									'cancelled',
									'converted',
								] as PreSale['status'][]
							)
								.filter((status) => {
									if (status === selectedPreSale.status) return true;

									const validTransitions: Record<
										PreSale['status'],
										PreSale['status'][]
									> = {
										draft: ['pending', 'cancelled'],
										pending: ['approved', 'cancelled', 'converted'],
										approved: ['converted', 'cancelled'],
										cancelled: [],
										converted: [],
									};

									return (
										validTransitions[selectedPreSale.status]?.includes(
											status,
										) || false
									);
								})
								.map((status) => {
									const isCurrent = selectedPreSale.status === status;

									const statusConfig = {
										draft: {
											icon: FileText,
											color: 'text-gray-600',
											bg: 'bg-gray-50',
											border: 'border-gray-200',
										},
										pending: {
											icon: Clock,
											color: 'text-yellow-600',
											bg: 'bg-yellow-50',
											border: 'border-yellow-200',
										},
										approved: {
											icon: CheckCircle,
											color: 'text-green-600',
											bg: 'bg-green-50',
											border: 'border-green-200',
										},
										cancelled: {
											icon: XCircle,
											color: 'text-red-600',
											bg: 'bg-red-50',
											border: 'border-red-200',
										},
										converted: {
											icon: Sparkles,
											color: 'text-purple-600',
											bg: 'bg-purple-50',
											border: 'border-purple-200',
										},
									};

									const config = statusConfig[status];
									const IconComponent = config.icon;

									return (
										<button
											key={status}
											onClick={() => updatePreSaleStatusLocal(status)}
											disabled={isCurrent}
											className={`
											relative p-3 rounded-lg border text-left transition-all duration-200
											${
												isCurrent
													? `${config.bg} ${config.border} opacity-60 cursor-not-allowed`
													: `bg-white ${config.border} hover:${config.bg} hover:shadow-md cursor-pointer`
											}
										`}
										>
											{isCurrent && (
												<div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded font-medium">
													Atual
												</div>
											)}

											<div className="flex items-center gap-2">
												<IconComponent className={`h-4 w-4 ${config.color}`} />
												<div>
													<p className="font-medium text-sm text-gray-900">
														{getStatusLabel(status)}
													</p>
													{status === 'converted' && !isCurrent && (
														<p className="text-xs text-purple-600 flex items-center gap-1">
															<Download className="h-3 w-3" />
															PDF incluído
														</p>
													)}
												</div>
											</div>
										</button>
									);
								})}
						</div>
					</div>
				</SimpleModal>
			)}

			{/* Modal de Confirmação de PDF - Compacto */}
			{showPdfConfirmModal && pendingConversion && (
				<SimpleModal
					isOpen={showPdfConfirmModal}
					onClose={() => {
						setShowPdfConfirmModal(false);
						setPendingConversion(null);
					}}
					title="Pré-venda Convertida!"
				>
					<div className="space-y-4">
						{/* Header compacto */}
						<div className="text-center">
							<div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
								<Sparkles className="h-6 w-6 text-green-600" />
							</div>
							<p className="text-gray-600">
								#{pendingConversion.id} - {pendingConversion.customer.name}
							</p>
							<p className="font-semibold text-green-600">
								R$ {pendingConversion.total.toFixed(2)}
							</p>
						</div>

						{/* Pergunta sobre PDF */}
						<div className="text-center p-3 bg-blue-50 rounded-lg">
							<div className="flex items-center justify-center gap-2 mb-2">
								<Download className="h-4 w-4 text-blue-600" />
								<span className="font-medium text-gray-900">Gerar PDF?</span>
							</div>
							<p className="text-sm text-gray-600">
								Deseja gerar o PDF desta pré-venda?
							</p>
						</div>

						{/* Botões de ação */}
						<div className="mobile-button-group flex flex-col sm:flex-row gap-2">
							<Button
								variant="secondary"
								onClick={() => handleConvertWithPdf(false)}
								className="flex-1 flex items-center justify-center gap-1 text-sm py-3 sm:py-2"
							>
								<X className="h-3 w-3" />
								Não
							</Button>
							<Button
								variant="primary"
								onClick={() => handleConvertWithPdf(true)}
								className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-sm py-3 sm:py-2"
							>
								<Download className="h-3 w-3" />
								Sim, gerar PDF
							</Button>
						</div>
					</div>
				</SimpleModal>
			)}
		</div>
	);
};

export default PresalesPage;
