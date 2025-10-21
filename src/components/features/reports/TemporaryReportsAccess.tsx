import { AlertTriangle, Key, Shield } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

/**
 * Temporary component to grant reports access for testing purposes
 * This should be removed in production
 */
export const TemporaryReportsAccess: React.FC = () => {
	const { user, permissions } = useAuth();
	const [isGranting, setIsGranting] = useState(false);

	const grantTemporaryAccess = () => {
		setIsGranting(true);

		// This is a temporary hack for testing - in production, permissions should be managed through the backend
		if (user && permissions) {
			// Store temporary permission flag
			localStorage.setItem('temp_reports_permission', 'true');

			// Force a page reload to reinitialize auth context
			setTimeout(() => {
				window.location.reload();
			}, 1000);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
				<div className="flex items-center justify-center w-16 h-16 mx-auto bg-orange-100 rounded-full mb-4">
					<AlertTriangle className="w-8 h-8 text-orange-600" />
				</div>

				<h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
					Acesso Temporário aos Relatórios
				</h1>

				<p className="text-gray-600 text-center mb-6">
					Para fins de teste, você pode habilitar temporariamente o acesso aos
					relatórios.
				</p>

				{/* Warning */}
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
					<div className="flex items-center mb-2">
						<AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
						<span className="text-sm font-medium text-yellow-800">Aviso</span>
					</div>
					<p className="text-sm text-yellow-700">
						Esta é uma solução temporária apenas para testes. Em produção, as
						permissões devem ser gerenciadas através do sistema de usuários.
					</p>
				</div>

				{/* User Info */}
				<div className="bg-gray-50 rounded-lg p-4 mb-6">
					<div className="flex items-center mb-2">
						<Shield className="w-4 h-4 text-gray-500 mr-2" />
						<span className="text-sm font-medium text-gray-700">
							Usuário Atual
						</span>
					</div>
					<p className="text-sm text-gray-600 ml-6">
						{user?.name} ({user?.email})
					</p>
				</div>

				{/* Action Button */}
				<button
					onClick={grantTemporaryAccess}
					disabled={isGranting}
					className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:bg-orange-400 transition-colors flex items-center justify-center"
				>
					{isGranting ? (
						<>
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
							Habilitando acesso...
						</>
					) : (
						<>
							<Key className="w-4 h-4 mr-2" />
							Habilitar Acesso Temporário
						</>
					)}
				</button>

				{/* Alternative Actions */}
				<div className="mt-4 space-y-2">
					<button
						onClick={() => (window.location.href = '#/dashboard')}
						className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
					>
						Voltar ao Dashboard
					</button>
				</div>

				{/* Instructions */}
				<div className="mt-6 text-xs text-gray-500">
					<p className="font-medium mb-2">Para uma solução permanente:</p>
					<ol className="list-decimal list-inside space-y-1">
						<li>Faça login como administrador</li>
						<li>Vá para "Gestão de Usuários"</li>
						<li>Edite as permissões do usuário</li>
						<li>Habilite "Relatórios"</li>
					</ol>
				</div>
			</div>
		</div>
	);
};

export default TemporaryReportsAccess;
