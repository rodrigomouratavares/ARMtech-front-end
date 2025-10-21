import { Filter, Search, SquarePen, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { SelectOption } from '../../../components/common/Select';
import Select from '../../../components/common/Select';
import toastService from '../../../services/ToastService';
import { userService } from '../../../services/userService';
import type { User } from '../../../types';
import Input from '../../common/Input';

interface UsersListProps {
	onEditUser?: (user: User) => void;
}

// Options for user type filter
const userTypeOptions: SelectOption[] = [
	{ value: 'all', label: 'Todos' },
	{ value: 'admin', label: 'Administrador' },
	{ value: 'employee', label: 'Funcionário' },
];

// Options for sort filter
const sortOptions: SelectOption[] = [
	{ value: 'name-asc', label: 'Nome (A-Z)' },
	{ value: 'name-desc', label: 'Nome (Z-A)' },
	{ value: 'email-asc', label: 'Email (A-Z)' },
	{ value: 'email-desc', label: 'Email (Z-A)' },
	{ value: 'createdAt-desc', label: 'Mais recentes' },
	{ value: 'createdAt-asc', label: 'Mais antigos' },
];

const UsersList: React.FC<UsersListProps> = ({ onEditUser }) => {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterType, setFilterType] = useState<'all' | 'admin' | 'employee'>(
		'all',
	);
	const [sortField, setSortField] = useState<'name' | 'email' | 'createdAt'>(
		'name',
	);
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
	const [sortValue, setSortValue] = useState('name-asc');

	const loadUsers = useCallback(async () => {
		try {
			setLoading(true);
			const usersData = await userService.getAllUsers();
			setUsers(usersData);
		} catch (error) {
			console.error('Error loading users:', error);
			toastService.error('Erro ao carregar usuários');
		} finally {
			setLoading(false);
		}
	}, []);

	// Load users on component mount
	useEffect(() => {
		loadUsers();
	}, [loadUsers]);

	const handleDeleteUser = async (user: User) => {
		if (user.id === '1') {
			toastService.error(
				'Não é possível excluir o usuário administrador principal',
			);
			return;
		}

		if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
			try {
				await userService.deleteUser(user.id);
				toastService.success(`Usuário ${user.name} excluído com sucesso!`);
				await loadUsers(); // Reload the list
			} catch (error) {
				console.error('Error deleting user:', error);
				toastService.error('Erro ao excluir usuário');
			}
		}
	};

	const handleEditUser = (user: User) => {
		if (onEditUser) {
			onEditUser(user);
		} else {
			toastService.info(`Editando usuário: ${user.name}`);
		}
	};

	// Filter and sort users
	const filteredAndSortedUsers = users
		.filter((user) => {
			// Filter by search term
			const matchesSearch =
				user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				user.email.toLowerCase().includes(searchTerm.toLowerCase());

			// Filter by user type
			const matchesType = filterType === 'all' || user.userType === filterType;

			return matchesSearch && matchesType;
		})
		.sort((a, b) => {
			let aValue: string | Date;
			let bValue: string | Date;

			switch (sortField) {
				case 'name':
					aValue = a.name.toLowerCase();
					bValue = b.name.toLowerCase();
					break;
				case 'email':
					aValue = a.email.toLowerCase();
					bValue = b.email.toLowerCase();
					break;
				case 'createdAt':
					aValue = a.createdAt;
					bValue = b.createdAt;
					break;
				default:
					aValue = a.name.toLowerCase();
					bValue = b.name.toLowerCase();
			}

			if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
			if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});

	const getUserTypeLabel = (userType: 'admin' | 'employee') => {
		return userType === 'admin' ? 'Administrador' : 'Funcionário';
	};

	const getUserTypeBadgeClass = (userType: 'admin' | 'employee') => {
		return userType === 'admin'
			? 'bg-purple-100 text-purple-800'
			: 'bg-blue-100 text-blue-800';
	};

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		}).format(date);
	};

	if (loading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold text-gray-800">
						Usuários Cadastrados
					</h2>
				</div>
				<div className="text-center py-8">
					<p className="text-gray-500">Carregando usuários...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold text-gray-800">
					Usuários Cadastrados
				</h2>
				<span className="text-sm text-gray-500">
					{filteredAndSortedUsers.length} de {users.length} usuários
				</span>
			</div>

			{/* Search and Filter Controls */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* Search */}
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
							size={16}
						/>
						<Input
							value={searchTerm}
							onChange={setSearchTerm}
							placeholder="Buscar por nome ou email..."
							className="pl-10"
						/>
					</div>

					{/* Filter by type */}
					<div className="relative">
						<Filter
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
							size={16}
						/>
						<Select
							value={filterType}
							onChange={(value) =>
								setFilterType(value as 'all' | 'admin' | 'employee')
							}
							options={userTypeOptions}
							className="pl-10"
						/>
					</div>

					{/* Sort */}
					<div>
						<Select
							value={sortValue}
							onChange={(value) => {
								const [field, direction] = value.split('-');
								setSortField(field as 'name' | 'email' | 'createdAt');
								setSortDirection(direction as 'asc' | 'desc');
								setSortValue(value);
							}}
							options={sortOptions}
						/>
					</div>
				</div>
			</div>

			{/* Users Grid */}
			{filteredAndSortedUsers.length > 0 ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{filteredAndSortedUsers.map((user) => (
						<div
							key={user.id}
							className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow flex flex-col h-full"
						>
							<div className="flex justify-between items-start mb-3">
								<div className="flex items-center space-x-3 flex-grow">
									<div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
										{user.name.charAt(0).toUpperCase()}
									</div>
									<div className="flex-grow min-w-0">
										<h3 className="font-semibold text-gray-900 truncate">
											{user.name}
										</h3>
										<p className="text-sm text-gray-600 truncate">
											{user.email}
										</p>
									</div>
								</div>
							</div>

							<div className="space-y-2 mb-3">
								<div className="flex justify-between items-center">
									<span className="text-xs text-gray-500">Tipo:</span>
									<span
										className={`text-xs px-2 py-1 rounded-full font-medium ${getUserTypeBadgeClass(user.userType)}`}
									>
										{getUserTypeLabel(user.userType)}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-xs text-gray-500">Status:</span>
									<span
										className={`text-xs px-2 py-1 rounded-full font-medium ${
											user.isActive
												? 'bg-green-100 text-green-800'
												: 'bg-red-100 text-red-800'
										}`}
									>
										{user.isActive ? 'Ativo' : 'Inativo'}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-xs text-gray-500">Criado em:</span>
									<span className="text-xs text-gray-700">
										{formatDate(user.createdAt)}
									</span>
								</div>
								{user.lastLoginAt && (
									<div className="flex justify-between items-center">
										<span className="text-xs text-gray-500">
											Último acesso:
										</span>
										<span className="text-xs text-gray-700">
											{formatDate(user.lastLoginAt)}
										</span>
									</div>
								)}
							</div>

							<div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-auto">
								<div className="text-xs text-gray-500">
									{user.userType === 'admin'
										? 'Acesso total'
										: 'Acesso limitado'}
								</div>
								<div className="flex space-x-2">
									<button
										type="button"
										className="text-blue-600 hover:text-blue-800 text-sm p-1"
										onClick={() => handleEditUser(user)}
										title="Editar usuário"
									>
										<SquarePen size={16} />
									</button>
									{user.id !== '1' && (
										<button
											type="button"
											className="text-red-600 hover:text-red-800 text-sm p-1"
											onClick={() => handleDeleteUser(user)}
											title="Excluir usuário"
										>
											<Trash2 size={16} />
										</button>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="text-center py-8">
					<p className="text-gray-500">
						{searchTerm || filterType !== 'all'
							? 'Nenhum usuário encontrado com os filtros aplicados.'
							: 'Nenhum usuário cadastrado ainda.'}
					</p>
				</div>
			)}
		</div>
	);
};

export default UsersList;
