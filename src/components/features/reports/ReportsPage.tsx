import React from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import Breadcrumb from '../../common/Breadcrumb';
import ErrorBoundary from '../../common/ErrorBoundary';
import PaymentMethodsReport from './PaymentMethodsReport';
import ReportsPermissionCheck from './ReportsPermissionCheck';

interface ReportsPageProps {
	className?: string;
}

/**
 * ReportsPage - Simplified container component for payment methods report
 * Directly displays the payment methods report without navigation or report type selection
 */
const ReportsPage: React.FC<ReportsPageProps> = React.memo(
	({ className = '' }) => {
		const permissions = usePermissions();

		// Check if user has permission to access reports
		const canAccessReports = permissions.canAccessReports();

		// If user doesn't have permission, show detailed permission check
		if (!canAccessReports) {
			return <ReportsPermissionCheck />;
		}

		// Main reports page content - directly render payment methods report
		return (
			<ErrorBoundary
				fallback={
					<div className="min-h-screen bg-gray-50 flex items-center justify-center">
						<div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
							<h2 className="text-xl font-bold text-gray-900 mb-4">
								Erro nos Relatórios
							</h2>
							<p className="text-gray-600 mb-6">
								Ocorreu um erro inesperado ao carregar os relatórios.
							</p>
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Recarregar Página
							</button>
						</div>
					</div>
				}
			>
				<div className={`min-h-screen bg-gray-50 ${className}`}>
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
						{/* Breadcrumb Navigation */}
						<div className="mb-4 sm:mb-6">
							<Breadcrumb />
						</div>

						{/* Page Header */}
						<div className="mb-6 sm:mb-8">
							<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
								Relatório de Formas de Pagamento
							</h1>
							<p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
								Análise de vendas por finalizadora
							</p>
						</div>

						{/* Payment Methods Report */}
						<PaymentMethodsReport />
					</div>
				</div>
			</ErrorBoundary>
		);
	},
);

export default ReportsPage;
