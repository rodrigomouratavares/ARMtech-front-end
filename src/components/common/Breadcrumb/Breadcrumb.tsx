import { ChevronRight, Home } from 'lucide-react';
import type React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
	label: string;
	path?: string;
	isActive?: boolean;
}

interface BreadcrumbProps {
	items?: BreadcrumbItem[];
	className?: string;
}

/**
 * Breadcrumb component for navigation hierarchy
 * Automatically generates breadcrumbs based on current route if no items provided
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
	const location = useLocation();

	// Auto-generate breadcrumbs if not provided
	const getBreadcrumbItems = (): BreadcrumbItem[] => {
		if (items) return items;

		const pathSegments = location.pathname.split('/').filter(Boolean);
		const breadcrumbItems: BreadcrumbItem[] = [
			{ label: 'Dashboard', path: '/dashboard' },
		];

		// Map path segments to readable labels
		const pathLabels: Record<string, string> = {
			dashboard: 'Dashboard',
			reports: 'Relatório de Formas de Pagamento',
			products: 'Produtos',
			customers: 'Clientes',
			presales: 'Pré-Vendas',
			users: 'Usuários',
			inventory: 'Estoque',
			'payment-methods': 'Formas de Pagamento',
			settings: 'Configurações',
		};

		// Build breadcrumb path
		let currentPath = '';
		for (const segment of pathSegments) {
			currentPath += `/${segment}`;
			const label = pathLabels[segment] || segment;

			// Don't duplicate dashboard
			if (segment !== 'dashboard') {
				breadcrumbItems.push({
					label,
					path: currentPath,
				});
			}
		}

		// Mark last item as active
		if (breadcrumbItems.length > 0) {
			breadcrumbItems[breadcrumbItems.length - 1].isActive = true;
		}

		return breadcrumbItems;
	};

	const breadcrumbItems = getBreadcrumbItems();

	return (
		<nav
			className={`flex items-center space-x-1 text-sm ${className}`}
			aria-label="Breadcrumb"
		>
			<ol className="flex items-center space-x-1">
				{breadcrumbItems.map((item, index) => (
					<li key={item.path || item.label} className="flex items-center">
						{index > 0 && (
							<ChevronRight
								className="h-4 w-4 text-slate-400 mx-1"
								aria-hidden="true"
							/>
						)}

						{item.isActive || !item.path ? (
							<span
								className={`font-medium ${
									item.isActive ? 'text-slate-900' : 'text-slate-600'
								}`}
								aria-current={item.isActive ? 'page' : undefined}
							>
								{index === 0 && (
									<Home className="h-4 w-4 inline mr-1" aria-hidden="true" />
								)}
								{item.label}
							</span>
						) : (
							<Link
								to={item.path}
								className="text-slate-500 hover:text-slate-700 transition-colors duration-200 flex items-center"
							>
								{index === 0 && (
									<Home className="h-4 w-4 inline mr-1" aria-hidden="true" />
								)}
								{item.label}
							</Link>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
};

export default Breadcrumb;
