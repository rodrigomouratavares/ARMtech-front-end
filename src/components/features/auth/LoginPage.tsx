import {
	AlertCircle,
	Eye,
	EyeOff,
	Loader,
	Lock,
	LogIn,
	User,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import flowcrmSvg from '../../../assets/flowcrm.svg';
import { useAuth } from '../../../context/AuthContext';

const LoginPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
	const [showPassword, setShowPassword] = useState(false);

	// Form state
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});

	// Local validation errors
	const [validationErrors, setValidationErrors] = useState({
		email: '',
		password: '',
	});

	// Get the intended destination from location state, default to dashboard
	const from =
		(location.state as { from?: { pathname: string } })?.from?.pathname ||
		'/dashboard';

	// Clear errors when component mounts or form data changes
	useEffect(() => {
		if (error) {
			clearError();
		}
	}, [error, clearError]);

	// Redirect if already authenticated
	if (isAuthenticated) {
		return <Navigate to={from} replace />;
	}

	// Handle input changes
	const handleInputChange =
		(field: keyof typeof formData) => (value: string) => {
			setFormData((prev) => ({
				...prev,
				[field]: value,
			}));

			// Clear field-specific validation error
			if (validationErrors[field]) {
				setValidationErrors((prev) => ({
					...prev,
					[field]: '',
				}));
			}
		};

	// Form validation
	const validateForm = (): boolean => {
		const errors = {
			email: '',
			password: '',
		};

		if (!formData.email) {
			errors.email = 'Email é obrigatório';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			errors.email = 'Email inválido';
		}

		if (!formData.password) {
			errors.password = 'Senha é obrigatória';
		} else if (formData.password.length < 3) {
			errors.password = 'Senha deve ter pelo menos 3 caracteres';
		}

		setValidationErrors(errors);
		return !errors.email && !errors.password;
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		try {
			await login(formData);
			navigate(from, { replace: true });
		} catch (loginError) {
			// Error is handled by the context and displayed via the error state
			console.error('Login failed:', loginError);
		}
	};

	return (
		<div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
			{/* Coluna da imagem (desktop) */}
			<div className="hidden lg:block relative h-full min-h-screen">
				<img
					src={flowcrmSvg}
					alt="Flow CRM Illustration"
					className="absolute inset-0 h-full w-full object-cover"
					loading="eager"
				/>
				<div className="absolute inset-0 bg-gradient-to-tr from-indigo-700/50 via-sky-600/30 to-transparent" />
			</div>

			{/* Coluna do formulário */}
			<div className="relative flex w-full items-center justify-center p-4 sm:p-6 lg:p-16 bg-gradient-to-br from-sky-50 via-white to-indigo-50 overflow-hidden mobile-landscape-adjust">
				{/* Background esmaecido atrás do formulário */}
				<img
					src={flowcrmSvg}
					alt="Fundo Flow CRM esmaecido"
					className="pointer-events-none select-none absolute inset-0 h-full w-full object-cover opacity-10 grayscale lg:hidden"
					aria-hidden="true"
				/>
				<div
					className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/70 via-white/40 to-transparent lg:hidden"
					aria-hidden="true"
				/>

				{/* Card do formulário */}
				<div className="relative z-10 w-full max-w-sm mx-auto bg-white shadow-lg shadow-gray-500 rounded-xl">
					{/* Header */}
					<div className="space-y-2 responsive-p-2 p-4 sm:p-6 pb-3 sm:pb-4">
						<h1 className="text-center responsive-text-lg text-xl sm:text-2xl font-bold text-gray-900">
							<span className="text-orange-500">Flow</span>{' '}
							<strong className="text-indigo-600">CRM</strong> | Entrar
						</h1>
						<p className="text-center responsive-text-sm text-xs sm:text-sm text-gray-600">
							Acesse sua conta para continuar
						</p>
					</div>

					{/* Content */}
					<div className="space-y-3 sm:space-y-4 responsive-p-2 p-4 sm:p-6 pt-2">
						{/* Global Error Display */}
						{error && (
							<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
								<div className="flex items-start space-x-2">
									<AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
									<div>
										<p className="text-red-800 font-medium responsive-text-sm text-xs sm:text-sm">
											Erro no login
										</p>
										<p className="text-red-700 text-xs mt-1">{error.message}</p>
									</div>
								</div>
							</div>
						)}

						{/* Login Form */}
						<form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
							{/* Email Field */}
							<div className="space-y-2">
								<label className="flex items-center gap-2 responsive-text-sm text-xs sm:text-sm font-medium text-gray-700">
									<User size={16} />
									Usuário
								</label>
								<input
									type="email"
									placeholder="Informe seu nome de usuário"
									value={formData.email}
									onChange={(e) => handleInputChange('email')(e.target.value)}
									className="w-full h-11 sm:h-10 px-3 responsive-text-sm text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors outline-none"
									disabled={isLoading}
									autoComplete="username"
								/>
								{validationErrors.email && (
									<p className="text-xs text-red-600">
										{validationErrors.email}
									</p>
								)}
							</div>

							{/* Password Field */}
							<div className="space-y-2">
								<label className="flex items-center gap-2 responsive-text-sm text-xs sm:text-sm font-medium text-gray-700">
									<Lock size={16} />
									Senha
								</label>
								<div className="relative">
									<input
										type={showPassword ? 'text' : 'password'}
										placeholder="Informe sua senha"
										value={formData.password}
										onChange={(e) =>
											handleInputChange('password')(e.target.value)
										}
										className="w-full h-11 sm:h-10 px-3 pr-10 responsive-text-sm text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors outline-none"
										disabled={isLoading}
										autoComplete="current-password"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-0 top-0 h-11 sm:h-10 w-10 flex items-center justify-center text-gray-500 hover:text-gray-700"
									>
										{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
									</button>
								</div>
								{validationErrors.password && (
									<p className="text-xs text-red-600">
										{validationErrors.password}
									</p>
								)}
							</div>

							{/* Submit Button */}
							<button
								type="submit"
								disabled={isLoading}
								className="w-full h-11 sm:h-10 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium responsive-text-sm text-sm rounded-lg transition-colors flex items-center justify-center space-x-2 mt-4"
							>
								{isLoading ? <Loader size={16} /> : <LogIn size={16} />}
								<span>{isLoading ? 'Entrando...' : 'Entrar'}</span>
							</button>
						</form>

						{/* Footer */}
						<div className="text-center pt-2">
							<p className="mt-1 text-xs text-gray-500">
								Ao continuar, você concorda com os termos de uso.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
