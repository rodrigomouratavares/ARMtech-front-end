import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getErrorMessage, logError } from '../../../utils/errorHandling';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	showRetry?: boolean;
	retryOperation?: () => Promise<void>;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	isRetrying: boolean;
}

/**
 * Error Boundary component to catch and handle React errors
 * Provides fallback UI and error logging
 */
class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			isRetrying: false,
		};
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
			errorInfo: null,
			isRetrying: false,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.setState({
			error,
			errorInfo,
		});

		// Log the error
		logError(error, {
			route: window.location.pathname,
			action: 'component_error',
		});

		// Call custom error handler if provided
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}
	}

	handleRetry = async () => {
		if (this.props.retryOperation) {
			this.setState({ isRetrying: true });
			try {
				await this.props.retryOperation();
				this.setState({
					hasError: false,
					error: null,
					errorInfo: null,
					isRetrying: false,
				});
			} catch (error) {
				this.setState({ isRetrying: false });
				// Error will be caught by componentDidCatch again
			}
		} else {
			this.setState({
				hasError: false,
				error: null,
				errorInfo: null,
				isRetrying: false,
			});
		}
	};

	handleGoHome = () => {
		window.location.href = '/dashboard';
	};

	render() {
		if (this.state.hasError) {
			// Custom fallback UI
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Default error UI
			return (
				<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
					<div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
						<div className="mb-6">
							<svg
								className="mx-auto h-16 w-16 text-red-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-label="Ícone de erro"
							>
								<title>Ícone de erro</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>

						<h1 className="text-2xl font-bold text-gray-900 mb-4">
							Ops! Algo deu errado
						</h1>

						<p className="text-gray-600 mb-6">
							{this.state.error
								? getErrorMessage(this.state.error)
								: 'Ocorreu um erro inesperado'}
						</p>

						{process.env.NODE_ENV === 'development' && this.state.error && (
							<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-left">
								<h3 className="text-sm font-medium text-red-800 mb-2">
									Detalhes do erro (desenvolvimento):
								</h3>
								<pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
									{this.state.error.stack}
								</pre>
							</div>
						)}

						<div className="space-y-3">
							{this.props.showRetry !== false && (
								<button
									type="button"
									onClick={this.handleRetry}
									disabled={this.state.isRetrying}
									className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{this.state.isRetrying ? (
										<>
											<svg
												className="animate-spin mr-2 h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												aria-label="Carregando"
											>
												<title>Carregando</title>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												/>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												/>
											</svg>
											Tentando novamente...
										</>
									) : (
										<>
											<svg
												className="mr-2 h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												aria-label="Ícone de tentar novamente"
											>
												<title>Ícone de tentar novamente</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
												/>
											</svg>
											Tentar Novamente
										</>
									)}
								</button>
							)}

							<button
								type="button"
								onClick={this.handleGoHome}
								className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								<svg
									className="mr-2 h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-label="Ícone de home"
								>
									<title>Ícone de home</title>
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
								Se o problema persistir, entre em contato com o suporte técnico.
							</p>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
