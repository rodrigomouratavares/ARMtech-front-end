import { AlertTriangle, Settings, Shield, User } from 'lucide-react';
import type React from 'react';
import { useAuth } from '../../../context/AuthContext';

/**
 * Component to diagnose and help resolve reports permission issues
 */
export const ReportsPermissionCheck: React.FC = () => {
	const { user, permissions, isAdmin, hasPermission } = useAuth();

	const hasReportsPermission = hasPermission('modules.reports');

	if (hasReportsPermission) {
		return null; // Don't show if user has permission
	}

	return (
		<div className="min-h-screen bg-gray-50 p-4">

			<div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
				<div className="flex items-center justify-center w-16 h-16 mx-auto bg-yellow-100 rounded-full mb-4">
					<AlertTriangle className="w-8 h-8 text-yellow-600" />
				</div>

				<h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
					Acesso aos Relatórios Negado
				</h1>

				<p className="text-gray-600 text-center mb-6">
					Você não tem permissão para acessar o módulo de relatórios.
				</p>

				{/* User Info */}
				<div className="bg-gray-50 rounded-lg p-4 mb-6">
					<div className="flex items-center mb-2">
						<User className="w-4 h-4 text-gray-500 mr-2" />
						<span className="text-sm font-medium text-gray-700">
							Usuário Atual
						</span>
					</div>
					<p className="text-sm text-gray-600 ml-6">
						{user?.name} ({user?.email})
					</p>
					<p className="text-sm text-gray-600 ml-6">
						Tipo: {isAdmin ? 'Administrador' : 'Funcionário'}
					</p>
				</div>

				{/* Permission Status */}
				<div className="bg-gray-50 rounded-lg p-4 mb-6">
					<div className="flex items-center mb-2">
						<Shield className="w-4 h-4 text-gray-500 mr-2" />
						<span className="text-sm font-medium text-gray-700">
							Status das Permissões
						</span>
					</div>
					<div className="ml-6 space-y-1">
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-600">Relatórios:</span>
							<span className="text-red-600 font-medium">❌ Negado</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-600">Produtos:</span>
							<span
								className={
									permissions?.modules.products
										? 'text-green-600'
										: 'text-red-600'
								}
							>
								{permissions?.modules.products ? '✅ Permitido' : '❌ Negado'}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-600">Clientes:</span>
							<span
								className={
									permissions?.modules.customers
										? 'text-green-600'
										: 'text-red-600'
								}
							>
								{permissions?.modules.customers ? '✅ Permitido' : '❌ Negado'}
							</span>
						</div>
					</div>
				</div>

				{/* Solution */}
				<div className="bg-blue-50 rounded-lg p-4 mb-6">
					<div className="flex items-center mb-2">
						<Settings className="w-4 h-4 text-blue-500 mr-2" />
						<span className="text-sm font-medium text-blue-700">
							Como Resolver
						</span>
					</div>
					<div className="ml-6 text-sm text-blue-600 space-y-2">
						{isAdmin ? (
							<p>
								Como administrador, você deveria ter acesso automático.
								Verifique se suas permissões estão configuradas corretamente no
								banco de dados.
							</p>
						) : (
							<>
								<p>
									Para acessar os relatórios, você precisa que um administrador:
								</p>
								<ol className="list-decimal list-inside space-y-1 mt-2">
									<li>Acesse o menu "Gestão de Usuários"</li>
									<li>Edite suas permissões</li>
									<li>Habilite a permissão "Relatórios"</li>
									<li>Salve as alterações</li>
								</ol>
							</>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex flex-col space-y-2">

					<button
						onClick={() => (window.location.href = '#/dashboard')}
						className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
					>
						Voltar ao Dashboard
					</button>

					{permissions?.modules.userManagement && (
						<button
							onClick={() => (window.location.href = '#/users')}
							className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
						>
							Ir para Gestão de Usuários
						</button>
					)}
				</div>


			</div>
		</div>
	);
};

export default ReportsPermissionCheck;
