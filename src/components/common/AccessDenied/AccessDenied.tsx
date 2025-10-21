import type React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

interface AccessDeniedProps {
	message?: string;
	showBackButton?: boolean;
	redirectTo?: string;
}

/**
 * AccessDenied component displays when user doesn't have permission to access a resource
 * Provides options to go back or redirect to a safe location
 */
const AccessDenied: React.FC<AccessDeniedProps> = ({
	message = 'Você não tem permissão para acessar esta página.',
	showBackButton = true,
	redirectTo = '/dashboard',
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { user, isAdmin } = useAuth();

	// Get context from navigation state if available
	const navigationState = location.state as {
		attemptedRoute?: string;
		message?: string;
		timestamp?: string;
	} | null;

	const displayMessage = navigationState?.message || message;

	const handleGoBack = () => {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			navigate(redirectTo);
		}
	};

	const handleGoToDashboard = () => {
		navigate(redirectTo);
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
			<div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
				<div className="mb-6">
					<svg
						className="mx-auto h-16 w-16 text-red-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-label="Ícone de acesso negado"
					>
						<title>Ícone de acesso negado</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
						/>
					</svg>
				</div>

				<h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>

				<p className="text-gray-600 mb-6">{displayMessage}</p>

				{navigationState?.attemptedRoute && (
					<div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
						<p className="text-sm text-yellow-800">
							<span className="font-medium">Rota solicitada:</span>{' '}
							{navigationState.attemptedRoute}
						</p>
					</div>
				)}

				{user && (
					<div className="mb-6 p-4 bg-gray-50 rounded-lg">
						<p className="text-sm text-gray-700">
							<span className="font-medium">Usuário:</span> {user.name}
						</p>
						<p className="text-sm text-gray-700">
							<span className="font-medium">Tipo:</span>{' '}
							{isAdmin ? 'Administrador' : 'Funcionário'}
						</p>
					</div>
				)}

				<div className="space-y-3">
					{showBackButton && (
						<button
							type="button"
							onClick={handleGoBack}
							className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							<svg
								className="mr-2 h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-label="Ícone de voltar"
							>
								<title>Ícone de voltar</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10 19l-7-7m0 0l7-7m-7 7h18"
								/>
							</svg>
							Voltar
						</button>
					)}

					<button
						type="button"
						onClick={handleGoToDashboard}
						className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						<svg
							className="mr-2 h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-label="Ícone de dashboard"
						>
							<title>Ícone de dashboard</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
							/>
						</svg>
						Ir para Dashboard
					</button>
				</div>

				<div className="mt-6 pt-6 border-t border-gray-200">
					<p className="text-xs text-gray-500">
						Se você acredita que deveria ter acesso a esta página, entre em
						contato com o administrador do sistema.
					</p>
				</div>
			</div>
		</div>
	);
};

export default AccessDenied;
