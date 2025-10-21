import { AlertCircle, CheckCircle, Shield, User } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { httpClient } from '../../../services/httpClient';

interface DebugUserInfo {
	id: string;
	email: string;
	name: string;
	role: string;
	permissions: any;
	isAdmin: boolean;
	hasReportsPermission: boolean;
	debugInfo: {
		permissionsObject: any;
		reportsPermissionValue: any;
		calculatedAccess: boolean;
	};
}

/**
 * Component to debug user permissions and backend validation
 * Only shows in development mode
 */
export const UserDebugInfo: React.FC = () => {
	const {
		user: frontendUser,
		permissions: frontendPermissions,
		isAdmin: frontendIsAdmin,
	} = useAuth();
	const [backendUserInfo, setBackendUserInfo] = useState<DebugUserInfo | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchBackendUserInfo = async () => {
			try {
				setLoading(true);
				const response = await httpClient.get<{
					success: boolean;
					data: DebugUserInfo;
				}>('/api/debug/user');
				setBackendUserInfo(response.data);
				setError(null);
			} catch (err: any) {
				setError(
					err.response?.data?.message ||
						err.message ||
						'Erro ao buscar informações do usuário',
				);
			} finally {
				setLoading(false);
			}
		};

		fetchBackendUserInfo();
	}, []);

	if (process.env.NODE_ENV !== 'development') {
		return null;
	}

	return (
		<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
			<div className="flex items-center mb-4">
				<Shield className="w-5 h-5 text-blue-600 mr-2" />
				<h3 className="text-lg font-semibold text-gray-900">
					Debug: Informações do Usuário
				</h3>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Frontend Info */}
				<div className="bg-blue-50 rounded-lg p-4">
					<h4 className="font-medium text-blue-900 mb-3 flex items-center">
						<User className="w-4 h-4 mr-2" />
						Frontend (AuthContext)
					</h4>
					<div className="space-y-2 text-sm">
						<div>
							<strong>Nome:</strong> {frontendUser?.name || 'N/A'}
						</div>
						<div>
							<strong>Email:</strong> {frontendUser?.email || 'N/A'}
						</div>
						<div>
							<strong>Tipo:</strong> {frontendUser?.userType || 'N/A'}
						</div>
						<div>
							<strong>É Admin:</strong> {frontendIsAdmin ? '✅ Sim' : '❌ Não'}
						</div>
						<div>
							<strong>Permissão Relatórios:</strong>{' '}
							{frontendPermissions?.modules.reports ? '✅ Sim' : '❌ Não'}
						</div>
					</div>
				</div>

				{/* Backend Info */}
				<div className="bg-green-50 rounded-lg p-4">
					<h4 className="font-medium text-green-900 mb-3 flex items-center">
						<Shield className="w-4 h-4 mr-2" />
						Backend (API Response)
					</h4>
					{loading ? (
						<div className="flex items-center text-sm text-gray-600">
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2" />
							Carregando...
						</div>
					) : error ? (
						<div className="flex items-center text-sm text-red-600">
							<AlertCircle className="w-4 h-4 mr-2" />
							{error}
						</div>
					) : backendUserInfo ? (
						<div className="space-y-2 text-sm">
							<div>
								<strong>Nome:</strong> {backendUserInfo.name}
							</div>
							<div>
								<strong>Email:</strong> {backendUserInfo.email}
							</div>
							<div>
								<strong>Role:</strong> {backendUserInfo.role}
							</div>
							<div>
								<strong>É Admin:</strong>{' '}
								{backendUserInfo.isAdmin ? '✅ Sim' : '❌ Não'}
							</div>
							<div>
								<strong>Acesso Relatórios:</strong>{' '}
								{backendUserInfo.hasReportsPermission ? '✅ Sim' : '❌ Não'}
							</div>
						</div>
					) : null}
				</div>
			</div>

			{/* Detailed Debug Info */}
			{backendUserInfo && (
				<div className="mt-6 bg-gray-50 rounded-lg p-4">
					<h4 className="font-medium text-gray-900 mb-3">Debug Detalhado</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div>
							<strong>Permissões no BD:</strong>
							<pre className="mt-1 bg-white p-2 rounded text-xs overflow-auto">
								{JSON.stringify(backendUserInfo.permissions, null, 2)}
							</pre>
						</div>
						<div>
							<strong>Cálculo de Acesso:</strong>
							<div className="mt-1 space-y-1">
								<div>Role = "{backendUserInfo.role}"</div>
								<div>
									É Admin = {backendUserInfo.isAdmin ? 'true' : 'false'}
								</div>
								<div>
									Permissão Reports ={' '}
									{backendUserInfo.debugInfo.reportsPermissionValue?.toString() ||
										'undefined'}
								</div>
								<div className="font-medium">
									Resultado ={' '}
									{backendUserInfo.hasReportsPermission
										? '✅ ACESSO'
										: '❌ NEGADO'}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Status Comparison */}
			<div className="mt-6 bg-yellow-50 rounded-lg p-4">
				<h4 className="font-medium text-yellow-900 mb-3">
					Comparação Frontend vs Backend
				</h4>
				<div className="space-y-2 text-sm">
					<div className="flex items-center justify-between">
						<span>Permissão de Relatórios:</span>
						<div className="flex items-center space-x-4">
							<span className="flex items-center">
								Frontend:{' '}
								{frontendPermissions?.modules.reports ? (
									<CheckCircle className="w-4 h-4 text-green-600 ml-1" />
								) : (
									<AlertCircle className="w-4 h-4 text-red-600 ml-1" />
								)}
							</span>
							<span className="flex items-center">
								Backend:{' '}
								{backendUserInfo?.hasReportsPermission ? (
									<CheckCircle className="w-4 h-4 text-green-600 ml-1" />
								) : (
									<AlertCircle className="w-4 h-4 text-red-600 ml-1" />
								)}
							</span>
						</div>
					</div>
					{frontendPermissions?.modules.reports !==
						backendUserInfo?.hasReportsPermission && (
						<div className="text-orange-600 font-medium">
							⚠️ Inconsistência detectada entre frontend e backend!
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default UserDebugInfo;
