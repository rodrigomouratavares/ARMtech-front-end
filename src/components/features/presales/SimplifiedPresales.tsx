import {
	Calculator,
	Edit,
	Eye,
	Plus,
	RotateCcw,
	Search,
	Trash2,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { usePresales } from '../../../hooks/usePresales';
import { usePresaleWorkflow } from '../../../hooks/usePresaleWorkflow';
import type { PreSale } from '../../../types/api';
import Button from '../../common/Button';
import Select from '../../common/Select';

const SimplifiedPresales: React.FC = () => {
	const { user, hasPermission, isAdmin, isEmployee } = useAuth();
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<PreSale['status'] | 'all'>(
		'all',
	);

	const {
		presales,
		loading,
		error,
		fetchPresales,
		deletePresale,
		updatePresaleStatus,
	} = usePresales({
		autoFetch: true,
		initialParams: {
			page: 1,
			limit: 20,
			sortBy: 'createdAt',
			sortOrder: 'desc',
		},
	});

	const {
		getStatusLabel,
		getStatusColor,
		canEditPresale,
		canDeletePresale,
		canConvertToSale,
		getValidNextStatuses,
		convertPresaleToSale,
	} = usePresaleWorkflow();

	const statusOptions = [
		{ value: 'all', label: 'Todos os Status' },
		{ value: 'draft', label: 'Rascunho' },
		{ value: 'pending', label: 'Pendente' },
		{ value: 'approved', label: 'Aprovada' },
		{ value: 'cancelled', label: 'Cancelada' },
		{ value: 'converted', label: 'Convertida' },
	];

	const filteredPresales = presales.filter((preSale) => {
		const matchesSearch =
			preSale.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			preSale.id.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus =
			statusFilter === 'all' || preSale.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	const handleViewPreSale = (preSale: PreSale) => {
		// TODO: Implement view modal or navigation
		console.log('View pre-sale:', preSale);
	};

	const handleCreatePreSale = () => {
		// TODO: Implement create modal or navigation
		console.log('Create new pre-sale');
	};

	const handleEditPreSale = (preSale: PreSale) => {
		if (!canEditPresale(preSale.status)) {
			console.warn('Cannot edit pre-sale in current status:', preSale.status);
			return;
		}
		// TODO: Implement edit modal or navigation
		console.log('Edit pre-sale:', preSale);
	};

	const handleDeletePreSale = async (preSale: PreSale) => {
		if (!canDeletePresale(preSale.status)) {
			console.warn('Cannot delete pre-sale in current status:', preSale.status);
			return;
		}

		if (confirm(`Tem certeza que deseja excluir a pré-venda #${preSale.id}?`)) {
			const success = await deletePresale(preSale.id);
			if (success) {
				console.log('Pre-sale deleted successfully');
			} else {
				console.error('Failed to delete pre-sale');
			}
		}
	};

	const handleStatusChange = async (
		preSale: PreSale,
		newStatus: PreSale['status'],
	) => {
		const result = await updatePresaleStatus(preSale.id, newStatus);
		if (result) {
			console.log('Status updated successfully:', result);
		} else {
			console.error('Failed to update status');
		}
	};

	const handleConvertToSale = async (preSale: PreSale) => {
		if (!canConvertToSale(preSale.status)) {
			console.warn(
				'Cannot convert pre-sale in current status:',
				preSale.status,
			);
			return;
		}

		if (
			confirm(
				`Tem certeza que deseja converter a pré-venda #${preSale.id} em venda?`,
			)
		) {
			const result = await convertPresaleToSale(preSale.id);
			if (result) {
				console.log('Pre-sale converted to sale successfully:', result);
			} else {
				console.error('Failed to convert pre-sale to sale');
			}
		}
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/4"></div>
					<div className="h-4 bg-gray-200 rounded w-1/2"></div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{[...Array(6)].map((_, i) => (
							<div
								key={`skeleton-${i}`}
								className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
							>
								<div className="space-y-3">
									<div className="h-4 bg-gray-200 rounded w-3/4"></div>
									<div className="h-4 bg-gray-200 rounded w-1/2"></div>
									<div className="h-6 bg-gray-200 rounded w-1/4"></div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6">
				<div className="text-center py-12">
					<div className="text-red-500 mb-4">
						<Calculator className="h-12 w-12 mx-auto mb-2" />
						<p className="text-lg font-medium">Erro ao carregar pré-vendas</p>
						<p className="text-sm text-gray-500 mt-1">{error}</p>
					</div>
					<Button
						variant="primary"
						onClick={() => fetchPresales()}
						className="mt-4"
					>
						Tentar Novamente
					</Button>
				</div>
			</div>
		);
	}

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
			</div>

			{/* Search and Filters */}
			<div className="space-y-4 mb-6">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-4 flex-1">
						<div className="relative flex-1 max-w-md">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
							<input
								type="text"
								placeholder="Buscar por cliente ou ID..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<Select
							value={statusFilter}
							onChange={(value) =>
								setStatusFilter(value as PreSale['status'] | 'all')
							}
							options={statusOptions}
							size="sm"
							className="w-48"
						/>
					</div>
					{(isAdmin || hasPermission('presales.canCreate')) && (
						<Button
							variant="primary"
							onClick={handleCreatePreSale}
							className="flex items-center space-x-2"
						>
							<Plus className="h-4 w-4" />
							<span>Nova Pré-venda</span>
						</Button>
					)}
				</div>
			</div>

			{/* Pre-sales List */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold text-gray-800">Pré-vendas</h2>
					<span className="text-sm text-gray-500">
						{filteredPresales.length} pré-vendas encontradas
					</span>
				</div>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{filteredPresales.map((preSale) => (
						<div
							key={preSale.id}
							className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
						>
							<div className="flex justify-between items-start mb-3">
								<div>
									<h3 className="font-semibold text-gray-900">#{preSale.id}</h3>
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
										R$ {Number(preSale.total).toFixed(2)}
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
									<span>
										{new Date(preSale.createdAt).toLocaleDateString('pt-BR')}
									</span>
								</div>
								<div className="flex space-x-1">
									<button
										type="button"
										onClick={() => handleViewPreSale(preSale)}
										className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
										title="Visualizar"
									>
										<Eye className="h-4 w-4" />
									</button>

									{/* Edit button - only for editable statuses */}
									{canEditPresale(preSale.status) &&
										(isAdmin ||
											(isEmployee && hasPermission('presales.canViewOwn'))) && (
											<button
												type="button"
												onClick={() => handleEditPreSale(preSale)}
												className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
												title="Editar"
											>
												<Edit className="h-4 w-4" />
											</button>
										)}

									{/* Status change button */}
									{getValidNextStatuses(preSale.status).length > 0 &&
										(isAdmin ||
											(isEmployee && hasPermission('presales.canViewOwn'))) && (
											<button
												type="button"
												onClick={() => {
													const nextStatuses = getValidNextStatuses(
														preSale.status,
													);
													if (nextStatuses.length === 1) {
														handleStatusChange(preSale, nextStatuses[0]);
													} else {
														// TODO: Show status selection modal
														console.log(
															'Multiple status options:',
															nextStatuses,
														);
													}
												}}
												className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded"
												title="Alterar Status"
											>
												<RotateCcw className="h-4 w-4" />
											</button>
										)}

									{/* Convert to sale button - only for approved status */}
									{canConvertToSale(preSale.status) &&
										(isAdmin ||
											(isEmployee && hasPermission('presales.canViewOwn'))) && (
											<button
												type="button"
												onClick={() => handleConvertToSale(preSale)}
												className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded"
												title="Converter em Venda"
											>
												💰
											</button>
										)}

									{/* Delete button - only for deletable statuses */}
									{canDeletePresale(preSale.status) &&
										(isAdmin ||
											(isEmployee && hasPermission('presales.canViewOwn'))) && (
											<button
												type="button"
												onClick={() => handleDeletePreSale(preSale)}
												className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
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

				{filteredPresales.length === 0 && (
					<div className="text-center py-12">
						<Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
						<p className="text-gray-500 text-lg">
							{searchTerm
								? 'Nenhuma pré-venda encontrada'
								: isEmployee &&
										!hasPermission('presales.canViewOwn') &&
										!hasPermission('presales.canViewAll')
									? 'Você não tem permissão para visualizar pré-vendas'
									: 'Nenhuma pré-venda cadastrada ainda.'}
						</p>
						{!searchTerm &&
							(isAdmin || hasPermission('presales.canCreate')) && (
								<Button
									variant="primary"
									onClick={handleCreatePreSale}
									className="mt-4"
								>
									Criar primeira pré-venda
								</Button>
							)}
					</div>
				)}
			</div>
		</div>
	);
};

export default SimplifiedPresales;
