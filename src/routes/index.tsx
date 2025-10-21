import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Lazy load components
const AccessDenied = lazy(() => import('../components/common/AccessDenied'));
const LoginPage = lazy(() =>
	import('../components/features/auth').then((module) => ({
		default: module.LoginPage,
	})),
);
const Customers = lazy(() =>
	import('../components/features/customers').then((module) => ({
		default: module.Customers,
	})),
);
const Dashboard = lazy(() => import('../components/features/dashboard'));
const InventoryPage = lazy(
	() => import('../components/features/inventory/InventoryPage'),
);
const PaymentMethodsPage = lazy(() =>
	import('../components/features/paymentMethods').then((module) => ({
		default: module.PaymentMethodsPage,
	})),
);
const Presales = lazy(() =>
	import('../components/features/presales').then((module) => ({
		default: module.Presales,
	})),
);
const ProductsPage = lazy(
	() => import('../components/features/products/ProductsPage'),
);
const UsersPage = lazy(() => import('../components/features/users/UsersPage'));
const ReportsPage = lazy(
	() => import('../components/features/reports/ReportsPage'),
);

// Loading component
const LoadingSpinner = () => (
	<div className="flex items-center justify-center min-h-screen">
		<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
	</div>
);

// Wrapper for lazy components
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
	<Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);

// Layout wrapper component that uses the authenticated user
const LayoutWrapper = ({
	children,
	title,
}: {
	children: React.ReactNode;
	title: string;
}) => {
	const { user } = useAuth();

	// This should only be rendered when user is authenticated (inside ProtectedRoute)
	if (!user) {
		return null;
	}

	return (
		<Layout title={title} user={user}>
			{children}
		</Layout>
	);
};

export const router = createHashRouter([
	{
		path: '/',
		element: <Navigate to="/dashboard" replace />,
	},
	{
		path: '/login',
		element: (
			<LazyWrapper>
				<LoginPage />
			</LazyWrapper>
		),
	},
	{
		path: '/dashboard',
		element: (
			<ProtectedRoute>
				<LayoutWrapper title="Dashboard">
					<LazyWrapper>
						<Dashboard />
					</LazyWrapper>
				</LayoutWrapper>
			</ProtectedRoute>
		),
	},
	{
		path: '/presales',
		element: (
			<ProtectedRoute requiredPermission="presales.canCreate">
				<LayoutWrapper title="Pré-vendas">
					<LazyWrapper>
						<Presales />
					</LazyWrapper>
				</LayoutWrapper>
			</ProtectedRoute>
		),
	},
	{
		path: '/products',
		element: (
			<ProtectedRoute requiredPermission="modules.products">
				<LayoutWrapper title="Produtos">
					<LazyWrapper>
						<ProductsPage />
					</LazyWrapper>
				</LayoutWrapper>
			</ProtectedRoute>
		),
	},
	{
		path: '/customers',
		element: (
			<ProtectedRoute requiredPermission="modules.customers">
				<LayoutWrapper title="Clientes">
					<LazyWrapper>
						<Customers />
					</LazyWrapper>
				</LayoutWrapper>
			</ProtectedRoute>
		),
	},
	{
		path: '/payment-methods',
		element: (
			<ProtectedRoute requiredPermission="modules.paymentMethods">
				<LayoutWrapper title="Formas de Pagamento">
					<LazyWrapper>
						<PaymentMethodsPage />
					</LazyWrapper>
				</LayoutWrapper>
			</ProtectedRoute>
		),
	},
	{
		path: '/inventory',
		element: (
			<ProtectedRoute>
				<LayoutWrapper title="Estoque">
					<LazyWrapper>
						<InventoryPage />
					</LazyWrapper>
				</LayoutWrapper>
			</ProtectedRoute>
		),
	},
	{
		path: '/users',
		element: (
			<ProtectedRoute
				requiredUserType="admin"
				requiredPermission="modules.userManagement"
			>
				<LayoutWrapper title="Gestão de Usuários">
					<LazyWrapper>
						<UsersPage />
					</LazyWrapper>
				</LayoutWrapper>
			</ProtectedRoute>
		),
	},
	{
		path: '/reports',
		element: (
			<ProtectedRoute requiredPermission="modules.reports">
				<LayoutWrapper title="Relatório de Formas de Pagamento">
					<LazyWrapper>
						<ReportsPage />
					</LazyWrapper>
				</LayoutWrapper>
			</ProtectedRoute>
		),
	},
	{
		path: '/settings',
		element: (
			<ProtectedRoute>
				<LayoutWrapper title="Configurações">
					<div className="p-6">
						<h1 className="text-2xl font-bold text-gray-900 mb-6">
							Configurações
						</h1>
						<div className="bg-white rounded-lg shadow p-6">
							<p className="text-gray-600">
								Página de configurações em desenvolvimento...
							</p>
						</div>
					</div>
				</LayoutWrapper>
			</ProtectedRoute>
		),
	},
	{
		path: '/access-denied',
		element: (
			<ProtectedRoute>
				<LazyWrapper>
					<AccessDenied />
				</LazyWrapper>
			</ProtectedRoute>
		),
	},
	{
		path: '*',
		element: (
			<ProtectedRoute>
				<LayoutWrapper title="Página não encontrada">
					<div className="p-6">
						<h1 className="text-2xl font-bold text-gray-900 mb-6">
							404 - Página não encontrada
						</h1>
						<div className="bg-white rounded-lg shadow p-6">
							<p className="text-gray-600">
								A página que você está procurando não existe.
							</p>
						</div>
					</div>
				</LayoutWrapper>
			</ProtectedRoute>
		),
	},
]);
