import { Check, Info, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { UserPermissions } from '../../../types';

interface PermissionsEditorProps {
	permissions: UserPermissions;
	onChange: (permissions: UserPermissions) => void;
	userType: 'admin' | 'employee';
	disabled?: boolean;
}

interface PermissionGroup {
	id: string;
	title: string;
	description: string;
	permissions: PermissionItem[];
}

interface PermissionItem {
	id: string;
	label: string;
	description: string;
	path: string; // Path to the permission in the UserPermissions object
	adminOnly?: boolean;
}

const PermissionsEditor: React.FC<PermissionsEditorProps> = ({
	permissions,
	onChange,
	userType,
	disabled = false,
}) => {
	const [expandedGroups, setExpandedGroups] = useState<string[]>([
		'modules',
		'presales',
	]);

	// Define permission groups and items
	const permissionGroups: PermissionGroup[] = [
		{
			id: 'modules',
			title: 'Módulos do Sistema',
			description: 'Controla o acesso aos diferentes módulos da aplicação',
			permissions: [
				{
					id: 'products',
					label: 'Produtos',
					description: 'Permite visualizar, criar, editar e excluir produtos',
					path: 'modules.products',
				},
				{
					id: 'customers',
					label: 'Clientes',
					description: 'Permite visualizar, criar, editar e excluir clientes',
					path: 'modules.customers',
				},
				{
					id: 'reports',
					label: 'Relatórios',
					description: 'Permite acessar relatórios e análises do sistema',
					path: 'modules.reports',
				},
				{
					id: 'paymentMethods',
					label: 'Formas de Pagamento',
					description:
						'Permite gerenciar formas de pagamento (apenas administradores)',
					path: 'modules.paymentMethods',
					adminOnly: true,
				},
				{
					id: 'userManagement',
					label: 'Gestão de Usuários',
					description:
						'Permite criar, editar e excluir usuários (apenas administradores)',
					path: 'modules.userManagement',
					adminOnly: true,
				},
			],
		},
		{
			id: 'presales',
			title: 'Pré-vendas',
			description: 'Controla as ações relacionadas às pré-vendas',
			permissions: [
				{
					id: 'canCreate',
					label: 'Criar Pré-vendas',
					description: 'Permite criar novas pré-vendas',
					path: 'presales.canCreate',
				},
				{
					id: 'canViewOwn',
					label: 'Ver Próprias Pré-vendas',
					description:
						'Permite visualizar pré-vendas criadas pelo próprio usuário',
					path: 'presales.canViewOwn',
				},
				{
					id: 'canViewAll',
					label: 'Ver Todas as Pré-vendas',
					description: 'Permite visualizar pré-vendas de todos os usuários',
					path: 'presales.canViewAll',
				},
			],
		},
	];

	// Helper function to get permission value by path
	const getPermissionValue = (path: string): boolean => {
		const keys = path.split('.');

		if (keys.length === 2) {
			const [section, permission] = keys;

			if (section === 'modules' && permission in permissions.modules) {
				return permissions.modules[
					permission as keyof typeof permissions.modules
				];
			} else if (section === 'presales' && permission in permissions.presales) {
				return permissions.presales[
					permission as keyof typeof permissions.presales
				];
			}
		}

		return false;
	};

	// Helper function to set permission value by path
	const setPermissionValue = (path: string, value: boolean) => {
		// Create a completely new permissions object
		const newPermissions: UserPermissions = {
			modules: {
				products: permissions.modules.products,
				customers: permissions.modules.customers,
				reports: permissions.modules.reports,
				paymentMethods: permissions.modules.paymentMethods,
				userManagement: permissions.modules.userManagement,
			},
			presales: {
				canCreate: permissions.presales.canCreate,
				canViewOwn: permissions.presales.canViewOwn,
				canViewAll: permissions.presales.canViewAll,
			},
		};

		const keys = path.split('.');
		if (keys.length === 2) {
			const [section, permission] = keys;

			if (section === 'modules') {
				switch (permission) {
					case 'products':
						newPermissions.modules.products = value;
						break;
					case 'customers':
						newPermissions.modules.customers = value;
						break;
					case 'reports':
						newPermissions.modules.reports = value;
						break;
					case 'paymentMethods':
						newPermissions.modules.paymentMethods = value;
						break;
					case 'userManagement':
						newPermissions.modules.userManagement = value;
						break;
				}
			} else if (section === 'presales') {
				switch (permission) {
					case 'canCreate':
						newPermissions.presales.canCreate = value;
						break;
					case 'canViewOwn':
						newPermissions.presales.canViewOwn = value;
						break;
					case 'canViewAll':
						newPermissions.presales.canViewAll = value;
						break;
				}
			}
		}

		onChange(newPermissions);
	};

	const toggleGroup = (groupId: string) => {
		setExpandedGroups((prev) =>
			prev.includes(groupId)
				? prev.filter((id) => id !== groupId)
				: [...prev, groupId],
		);
	};

	const toggleAllInGroup = (group: PermissionGroup, enable: boolean) => {
		const availablePermissions = group.permissions.filter(
			(perm) => !perm.adminOnly || userType === 'admin',
		);

		// Create a completely new permissions object with explicit property assignment
		const newPermissions: UserPermissions = {
			modules: {
				products: permissions.modules.products,
				customers: permissions.modules.customers,
				reports: permissions.modules.reports,
				paymentMethods: permissions.modules.paymentMethods,
				userManagement: permissions.modules.userManagement,
			},
			presales: {
				canCreate: permissions.presales.canCreate,
				canViewOwn: permissions.presales.canViewOwn,
				canViewAll: permissions.presales.canViewAll,
			},
		};

		// Update each available permission
		availablePermissions.forEach((permission) => {
			const keys = permission.path.split('.');
			if (keys.length === 2) {
				const [section, permissionKey] = keys;

				if (section === 'modules') {
					switch (permissionKey) {
						case 'products':
							newPermissions.modules.products = enable;
							break;
						case 'customers':
							newPermissions.modules.customers = enable;
							break;
						case 'reports':
							newPermissions.modules.reports = enable;
							break;
						case 'paymentMethods':
							newPermissions.modules.paymentMethods = enable;
							break;
						case 'userManagement':
							newPermissions.modules.userManagement = enable;
							break;
					}
				} else if (section === 'presales') {
					switch (permissionKey) {
						case 'canCreate':
							newPermissions.presales.canCreate = enable;
							break;
						case 'canViewOwn':
							newPermissions.presales.canViewOwn = enable;
							break;
						case 'canViewAll':
							newPermissions.presales.canViewAll = enable;
							break;
					}
				}
			}
		});

		onChange(newPermissions);
	};

	const getGroupStatus = (group: PermissionGroup): 'all' | 'some' | 'none' => {
		const availablePermissions = group.permissions.filter(
			(perm) => !perm.adminOnly || userType === 'admin',
		);

		const enabledCount = availablePermissions.filter((perm) =>
			getPermissionValue(perm.path),
		).length;

		if (enabledCount === 0) return 'none';
		if (enabledCount === availablePermissions.length) return 'all';
		return 'some';
	};

	if (userType === 'admin') {
		return (
			<div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
				<div className="flex items-center space-x-3 mb-4">
					<div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
						<Check className="w-5 h-5 text-purple-600" />
					</div>
					<div>
						<h3 className="text-lg font-medium text-purple-900">
							Administrador - Acesso Completo
						</h3>
						<p className="text-sm text-purple-700">
							Administradores têm acesso total a todos os módulos e
							funcionalidades do sistema.
						</p>
					</div>
				</div>

				<div className="bg-white rounded-lg p-4 border border-purple-200">
					<h4 className="font-medium text-gray-900 mb-2">
						Permissões Incluídas:
					</h4>
					<ul className="text-sm text-gray-700 space-y-1">
						<li>
							• Todos os módulos (Produtos, Clientes, Relatórios, Formas de
							Pagamento, Usuários)
						</li>
						<li>
							• Todas as ações de pré-vendas (criar, visualizar próprias e de
							outros usuários)
						</li>
						<li>
							• Acesso completo a configurações e administração do sistema
						</li>
					</ul>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-start space-x-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
				<Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
				<div>
					<h3 className="font-medium text-blue-900 mb-1">
						Editor de Permissões Granulares
					</h3>
					<p className="text-sm text-blue-700">
						Configure as permissões específicas para este funcionário. Marque
						apenas as funcionalidades que ele deve ter acesso.
					</p>
				</div>
			</div>

			{permissionGroups.map((group) => {
				const isExpanded = expandedGroups.includes(group.id);
				const groupStatus = getGroupStatus(group);
				const availablePermissions = group.permissions.filter(
					(perm) => !perm.adminOnly || (userType as string) === 'admin',
				);

				return (
					<div
						key={group.id}
						className="bg-white border border-gray-200 rounded-lg overflow-hidden"
					>
						{/* Group Header */}
						<div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
							<div className="flex items-center justify-between">
								<button
									type="button"
									className="flex-1 text-left cursor-pointer hover:bg-gray-100 transition-colors rounded p-2 -m-2"
									onClick={() => toggleGroup(group.id)}
								>
									<div className="flex items-center space-x-3">
										<h3 className="text-lg font-medium text-gray-900">
											{group.title}
										</h3>
										<div className="flex items-center space-x-2">
											{groupStatus === 'all' && (
												<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
													<Check className="w-3 h-3 mr-1" />
													Todas habilitadas
												</span>
											)}
											{groupStatus === 'some' && (
												<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
													Parcialmente habilitadas
												</span>
											)}
											{groupStatus === 'none' && (
												<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
													<X className="w-3 h-3 mr-1" />
													Nenhuma habilitada
												</span>
											)}
										</div>
										<div
											className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
										>
											<svg
												className="w-5 h-5 text-gray-400"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M19 9l-7 7-7-7"
												/>
											</svg>
										</div>
									</div>
									<p className="text-sm text-gray-600 mt-1">
										{group.description}
									</p>
								</button>
								<div className="flex items-center space-x-2 ml-4">
									{!disabled && (
										<>
											<button
												type="button"
												onClick={() => toggleAllInGroup(group, true)}
												className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
											>
												Habilitar Todas
											</button>
											<button
												type="button"
												onClick={() => toggleAllInGroup(group, false)}
												className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
											>
												Desabilitar Todas
											</button>
										</>
									)}
								</div>
							</div>
						</div>

						{/* Group Content */}
						{isExpanded && (
							<div className="px-6 py-4">
								<div className="grid gap-4">
									{availablePermissions.map((permission) => {
										const isEnabled = getPermissionValue(permission.path);

										return (
											<div
												key={permission.id}
												className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
													isEnabled
														? 'bg-green-50 border-green-200'
														: 'bg-gray-50 border-gray-200'
												}`}
											>
												<div className="flex items-center h-5 pt-0.5">
													<input
														id={`${group.id}-${permission.id}`}
														type="checkbox"
														checked={isEnabled}
														disabled={disabled}
														onChange={(e) => {
															setPermissionValue(
																permission.path,
																e.target.checked,
															);
														}}
														className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
													/>
												</div>
												<div className="flex-1 min-w-0">
													<label
														htmlFor={`${group.id}-${permission.id}`}
														className={`block text-sm font-medium cursor-pointer ${
															isEnabled ? 'text-green-900' : 'text-gray-900'
														}`}
													>
														{permission.label}
														{permission.adminOnly && (
															<span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
																Admin
															</span>
														)}
													</label>
													<p
														className={`text-xs mt-1 ${
															isEnabled ? 'text-green-700' : 'text-gray-600'
														}`}
													>
														{permission.description}
													</p>
												</div>
												<div className="flex-shrink-0 pt-0.5">
													{isEnabled ? (
														<Check className="w-5 h-5 text-green-600" />
													) : (
														<X className="w-5 h-5 text-gray-400" />
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default PermissionsEditor;
