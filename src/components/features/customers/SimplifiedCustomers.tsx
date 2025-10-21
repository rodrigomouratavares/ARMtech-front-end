import { Loader2, RefreshCw, Search, SquarePen, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../hooks/useCustomers';
import toastService, { TOAST_MESSAGES } from '../../../services/ToastService';
import type {
	Customer as ApiCustomer,
	CreateCustomerRequest,
} from '../../../types/api';
import { formatCPF, validateCPF } from '../../../utils';
import Button from '../../common/Button';
import Input from '../../common/Input';

type TabType = 'list' | 'register';
// All fields are now consolidated into a single form - no subtabs needed

const SimplifiedCustomers: React.FC = () => {
	const { isAdmin, isEmployee, hasPermission, user } = useAuth();
	const [activeTab, setActiveTab] = useState<TabType>('list');
	const [searchQuery, setSearchQuery] = useState('');

	// Use the custom hook for customer management
	const {
		customers,
		loading,
		error,
		searchCustomers,
		createCustomer,
		updateCustomer,
		deleteCustomer,
		clearError,
		refetch,
	} = useCustomers({ page: 1, limit: 20 });

	// Search functionality (similar to products page)
	const handleSearch = async () => {
		if (searchQuery.trim()) {
			await searchCustomers(searchQuery.trim(), { page: 1, limit: 20 });
		} else {
			await refetch();
		}
	};

	const [formData, setFormData] = useState({
		name: '',
		cpf: '',
		email: '',
		phone: '',
		address: '',
	});

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingCustomer, setEditingCustomer] = useState<ApiCustomer | null>(
		null,
	);

	// Clear error when component mounts or when switching tabs
	useEffect(() => {
		if (error) {
			toastService.error(error.message || 'Erro ao carregar clientes');
		}
	}, [error]);

	// Functions for customer operations
	const handleEditCustomer = (customer: ApiCustomer) => {
		setEditingCustomer(customer);
		setFormData({
			name: customer.name,
			cpf: customer.cpf,
			email: customer.email,
			phone: customer.phone,
			address: customer.address || '',
		});
		setActiveTab('register');
		toastService.info(`Editando cliente: ${customer.name}`);
	};

	const handleDeleteCustomer = async (customer: ApiCustomer) => {
		if (confirm(TOAST_MESSAGES.customer.deleteConfirm)) {
			try {
				await deleteCustomer(customer.id);
				toastService.success(`Cliente ${customer.name} excluído com sucesso!`);
				// Refresh the list after successful deletion
				// If we have a search query, maintain the search, otherwise refetch all
				if (searchQuery.trim()) {
					await searchCustomers(searchQuery.trim(), { page: 1, limit: 20 });
				} else {
					await refetch();
				}
			} catch (err: any) {
				const msg = err?.message || 'Erro ao excluir cliente';
				toastService.error(msg);
				// Refresh the list even in case of error to ensure consistency
				// If we have a search query, maintain the search, otherwise refetch all
				if (searchQuery.trim()) {
					await searchCustomers(searchQuery.trim(), { page: 1, limit: 20 });
				} else {
					await refetch();
				}
			}
		}
	};

	const handleInputChange = (field: string) => (value: string) => {
		let processedValue = value;

		// Format CPF as user types
		if (field === 'cpf') {
			processedValue = formatCPF(value);
		}

		// Format phone as user types
		if (field === 'phone') {
			processedValue = value
				.replace(/\D/g, '')
				.replace(/(\d{2})(\d)/, '($1) $2')
				.replace(/(\d{5})(\d)/, '$1-$2')
				.replace(/(-\d{4})\d+?$/, '$1');
		}

		setFormData((prev) => ({ ...prev, [field]: processedValue }));

		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: '' }));
		}
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = 'Nome é obrigatório';
		}

		if (!formData.email.trim()) {
			newErrors.email = 'Email é obrigatório';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = 'Email inválido';
		}

		if (!formData.cpf.trim()) {
			newErrors.cpf = 'CPF é obrigatório';
		} else if (!validateCPF(formData.cpf)) {
			newErrors.cpf = 'CPF inválido';
		}

		if (!formData.phone.trim()) {
			newErrors.phone = 'Telefone é obrigatório';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);

		try {
			const customerData: CreateCustomerRequest = {
				name: formData.name.trim(),
				email: formData.email.trim(),
				phone: formData.phone.trim(),
				cpf: formData.cpf.replace(/\D/g, ''), // Remove formatting for API
				address: formData.address.trim() || undefined,
			};

			let success = false;

			if (editingCustomer) {
				// Update existing customer
				const result = await updateCustomer(editingCustomer.id, customerData);
				success = result !== null;
				if (success) {
					toastService.success('Cliente atualizado com sucesso!');
					setEditingCustomer(null);
				}
			} else {
				// Create new customer
				const result = await createCustomer(customerData);
				success = result !== null;
				if (success) {
					toastService.success(TOAST_MESSAGES.customer.created);
				}
			}

			// Always refresh the list to ensure consistency
			// If we have a search query, maintain the search, otherwise refetch all
			if (searchQuery.trim()) {
				await searchCustomers(searchQuery.trim(), { page: 1, limit: 20 });
			} else {
				await refetch();
			}

			// Only proceed with UI updates if the operation was successful
			if (success) {
				// Reset form after successful submit
				setFormData({
					name: '',
					cpf: '',
					email: '',
					phone: '',
					address: '',
				});
				setErrors({});
				setActiveTab('list');
			}
		} catch (error) {
			const errorMessage = editingCustomer
				? 'Erro ao atualizar cliente'
				: 'Erro ao criar cliente';
			toastService.error(errorMessage);
			// Refresh the list even in case of error to ensure consistency
			// If we have a search query, maintain the search, otherwise refetch all
			if (searchQuery.trim()) {
				await searchCustomers(searchQuery.trim(), { page: 1, limit: 20 });
			} else {
				await refetch();
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancelEdit = () => {
		setEditingCustomer(null);
		setFormData({
			name: '',
			cpf: '',
			email: '',
			phone: '',
			address: '',
		});
		setErrors({});
		setActiveTab('list');
	};

	const renderTabContent = () => {
		if (activeTab === 'list') {
			return (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-gray-800">
							Clientes Cadastrados
						</h2>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-500">
								{customers.length} clientes
							</span>
							<button
								type="button"
								onClick={refetch}
								disabled={loading}
								className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
								title="Atualizar lista"
							>
								<RefreshCw
									size={16}
									className={loading ? 'animate-spin' : ''}
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
								placeholder="Buscar clientes por nome, email ou CPF..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<Button
							onClick={handleSearch}
							disabled={loading}
							variant="secondary"
						>
							Buscar
						</Button>
					</div>

					{/* Error Display */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<div className="flex items-center justify-between">
								<p className="text-red-700">
									{error.message || 'Erro ao carregar clientes'}
								</p>
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
					{loading && (
						<div className="flex justify-center items-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
							<span className="ml-2 text-gray-600">Carregando clientes...</span>
						</div>
					)}

					{!loading && (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{customers.map((customer) => (
								<div
									key={customer.id}
									className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow flex flex-col h-full"
								>
									<div className="flex justify-between items-start mb-2">
										<div className="flex-grow pr-2">
											<h3 className="font-semibold text-gray-900 line-clamp-1">
												{customer.name}
											</h3>
											<p className="text-xs text-gray-600">
												CPF:{' '}
												{customer.cpf
													? formatCPF(customer.cpf)
													: 'Não informado'}
											</p>
										</div>
										<div className="text-right flex-shrink-0">
											<p className="text-sm font-medium text-gray-700 whitespace-nowrap">
												{customer.phone}
											</p>
										</div>
									</div>
									<div className="text-gray-700 text-sm mb-3">
										<p className="line-clamp-1">{customer.email}</p>
										<p className="text-xs text-gray-500 mt-1">
											{customer.address}
										</p>
									</div>
									<div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-auto">
										<span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
											Ativo
										</span>
										{(isAdmin || hasPermission('modules.customers')) && (
											<div className="flex space-x-2">
												<button
													type="button"
													className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
													onClick={() => handleEditCustomer(customer)}
													title="Editar cliente"
													disabled={loading}
												>
													<SquarePen size={16} />
												</button>
												<button
													type="button"
													className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
													onClick={() => handleDeleteCustomer(customer)}
													title="Excluir cliente"
													disabled={loading}
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

					{customers.length === 0 && (
						<div className="text-center py-8">
							<p className="text-gray-500">
								{searchQuery
									? 'Nenhum cliente encontrado para a busca.'
									: 'Nenhum cliente cadastrado ainda.'}
							</p>
						</div>
					)}
				</div>
			);
		}

		// Register tab: consolidated form with all fields
		return (
			<form onSubmit={handleSubmit} className="space-y-8">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-lg font-medium text-gray-900">
							{editingCustomer ? 'Editar Cliente' : 'Informações Pessoais'}
						</h3>
						{editingCustomer && (
							<button
								type="button"
								onClick={handleCancelEdit}
								className="text-gray-500 hover:text-gray-700 text-sm"
							>
								Cancelar edição
							</button>
						)}
					</div>
					<div className="space-y-6">
						{/* First row: Name and CPF */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Input
								label="Nome Completo*"
								value={formData.name}
								onChange={handleInputChange('name')}
								placeholder="Digite o nome completo"
								error={errors.name}
								required
							/>

							<Input
								label="CPF/CNPJ*"
								value={formData.cpf}
								onChange={handleInputChange('cpf')}
								placeholder="000.000.000-00"
								error={errors.cpf}
								maxLength={14}
								required
							/>
						</div>

						{/* Second row: Email and Phone */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Input
								label="E-mail*"
								type="email"
								value={formData.email}
								onChange={handleInputChange('email')}
								placeholder="exemplo@email.com"
								error={errors.email}
								required
							/>

							<Input
								label="Telefone*"
								value={formData.phone}
								onChange={handleInputChange('phone')}
								placeholder="(11) 99999-9999"
								error={errors.phone}
								maxLength={15}
								required
							/>
						</div>

						{/* Third row: Address */}
						<div>
							<Input
								label="Endereço"
								value={formData.address}
								onChange={handleInputChange('address')}
								placeholder="Rua, número, bairro, cidade - UF"
							/>
						</div>
					</div>
				</div>

				{/* Botões de Ação */}
				<div className="flex justify-end space-x-3">
					<Button
						type="button"
						variant="secondary"
						onClick={() => {
							if (editingCustomer) {
								handleCancelEdit();
							} else {
								setFormData({
									name: '',
									cpf: '',
									email: '',
									phone: '',
									address: '',
								});
								setErrors({});
							}
						}}
						disabled={isSubmitting}
					>
						{editingCustomer ? 'Cancelar' : 'Limpar'}
					</Button>
					<Button
						type="submit"
						variant="primary"
						loading={isSubmitting}
						disabled={isSubmitting}
					>
						{isSubmitting ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								{editingCustomer ? 'Atualizando...' : 'Cadastrando...'}
							</>
						) : editingCustomer ? (
							'Atualizar Cliente'
						) : (
							'Cadastrar Cliente'
						)}
					</Button>
				</div>
			</form>
		);
	};

	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
				<p className="text-gray-600 mt-1">
					{isAdmin
						? 'Gerencie todos os clientes do sistema'
						: hasPermission('modules.customers')
							? `Cadastre e edite clientes - ${user?.name}`
							: 'Acesso limitado aos clientes'}
				</p>
				{isEmployee && !hasPermission('modules.customers') && (
					<p className="text-sm text-red-600 mt-1">
						Você não tem permissão para acessar o módulo de clientes
					</p>
				)}
			</div>

			{/* Tabs */}
			{isAdmin || hasPermission('modules.customers') ? (
				<div className="mb-6">
					<div className="border-b border-gray-200">
						<nav className="-mb-px flex space-x-8" aria-label="Tabs">
							<button
								key="list-tab"
								type="button"
								onClick={() => setActiveTab('list')}
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
								onClick={() => {
									setActiveTab('register');
									if (editingCustomer) {
										handleCancelEdit();
									}
								}}
								className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === 'register'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								{editingCustomer ? 'Editando' : 'Cadastro'}
							</button>
						</nav>
					</div>
				</div>
			) : (
				<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-red-700 text-center">
						Você não tem permissão para acessar o módulo de clientes.
					</p>
					<p className="text-red-600 text-sm text-center mt-1">
						Entre em contato com o administrador para solicitar acesso.
					</p>
				</div>
			)}

			{/* Tab Content */}
			{(isAdmin || hasPermission('modules.customers')) && (
				<div className="mt-6">{renderTabContent()}</div>
			)}
		</div>
	);
};

export default SimplifiedCustomers;
