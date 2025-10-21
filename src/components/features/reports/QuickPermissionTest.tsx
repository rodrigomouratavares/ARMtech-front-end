import { AlertCircle, CheckCircle, TestTube, XCircle } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { httpClient } from '../../../services/httpClient';

/**
 * Quick test component to verify if reports API is accessible
 */
export const QuickPermissionTest: React.FC = () => {
	const { user, isAdmin } = useAuth();
	const [testResult, setTestResult] = useState<{
		status: 'idle' | 'testing' | 'success' | 'error';
		message: string;
		details?: any;
	}>({ status: 'idle', message: '' });

	const testReportsAccess = async () => {
		setTestResult({
			status: 'testing',
			message: 'Testando acesso aos relatórios...',
		});

		try {
			// First test database connectivity
			const dbTest = await httpClient.get('/api/debug/db');

			// Then test simple reports
			const reportsTest = await httpClient.get('/api/debug/reports');

			// Finally test the actual reports API
			const response = await httpClient.get('/api/reports/summary');

			setTestResult({
				status: 'success',
				message: 'Sucesso! Todos os testes passaram.',
				details: {
					dbTest: dbTest,
					reportsTest: reportsTest,
					finalResponse: response,
					responseStatus: 200,
				},
			});
		} catch (error: any) {
			const status = error.response?.status;
			const message = error.response?.data?.message || error.message;

			setTestResult({
				status: 'error',
				message: `Erro ${status}: ${message}`,
				details: {
					responseStatus: status,
					errorCode: error.response?.data?.code,
					fullError: error.response?.data,
					errorStep: error.config?.url || 'unknown',
				},
			});
		}
	};

	if (process.env.NODE_ENV !== 'development') {
		return null;
	}

	return (
		<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
			<div className="flex items-center mb-4">
				<TestTube className="w-5 h-5 text-purple-600 mr-2" />
				<h3 className="text-lg font-semibold text-gray-900">
					Teste Rápido de Acesso
				</h3>
			</div>

			{/* User Info */}
			<div className="bg-gray-50 rounded-lg p-4 mb-4">
				<div className="text-sm space-y-1">
					<div>
						<strong>Usuário:</strong> {user?.name} ({user?.email})
					</div>
					<div>
						<strong>É Admin:</strong> {isAdmin ? '✅ Sim' : '❌ Não'}
					</div>
				</div>
			</div>

			{/* Test Button */}
			<button
				onClick={testReportsAccess}
				disabled={testResult.status === 'testing'}
				className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors flex items-center justify-center mb-4"
			>
				{testResult.status === 'testing' ? (
					<>
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
						Testando...
					</>
				) : (
					<>
						<TestTube className="w-4 h-4 mr-2" />
						Testar Acesso aos Relatórios
					</>
				)}
			</button>

			{/* Test Result */}
			{testResult.status !== 'idle' && (
				<div
					className={`rounded-lg p-4 ${
						testResult.status === 'success'
							? 'bg-green-50 border border-green-200'
							: testResult.status === 'error'
								? 'bg-red-50 border border-red-200'
								: 'bg-blue-50 border border-blue-200'
					}`}
				>
					<div className="flex items-center mb-2">
						{testResult.status === 'success' ? (
							<CheckCircle className="w-5 h-5 text-green-600 mr-2" />
						) : testResult.status === 'error' ? (
							<XCircle className="w-5 h-5 text-red-600 mr-2" />
						) : (
							<AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
						)}
						<span
							className={`font-medium ${
								testResult.status === 'success'
									? 'text-green-800'
									: testResult.status === 'error'
										? 'text-red-800'
										: 'text-blue-800'
							}`}
						>
							Resultado do Teste
						</span>
					</div>

					<p
						className={`text-sm mb-3 ${
							testResult.status === 'success'
								? 'text-green-700'
								: testResult.status === 'error'
									? 'text-red-700'
									: 'text-blue-700'
						}`}
					>
						{testResult.message}
					</p>

					{testResult.details && (
						<details className="text-xs">
							<summary className="cursor-pointer font-medium mb-2">
								Detalhes Técnicos
							</summary>
							<pre className="bg-white p-2 rounded overflow-auto">
								{JSON.stringify(testResult.details, null, 2)}
							</pre>
						</details>
					)}

					{testResult.status === 'success' && (
						<div className="mt-3 p-3 bg-green-100 rounded">
							<p className="text-green-800 font-medium">
								🎉 Ótimo! A correção funcionou!
							</p>
							<p className="text-green-700 text-sm mt-1">
								Agora você pode acessar os relatórios normalmente. Recarregue a
								página para ver os dados.
							</p>
						</div>
					)}

					{testResult.status === 'error' &&
						testResult.details?.responseStatus === 403 && (
							<div className="mt-3 p-3 bg-red-100 rounded">
								<p className="text-red-800 font-medium">❌ Ainda sem acesso</p>
								<p className="text-red-700 text-sm mt-1">
									O servidor ainda está negando acesso. Pode ser necessário
									reiniciar o servidor ou verificar as permissões no banco de
									dados.
								</p>
							</div>
						)}
				</div>
			)}
		</div>
	);
};

export default QuickPermissionTest;
