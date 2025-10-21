import {
	BarChart3,
	ChevronDown,
	ChevronLeft,
	CreditCard,
	FileText,
	Home,
	LogOut,
	Package,
	ShoppingCart,
	Users,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';
import type { MenuItem } from '../../../types';

interface SidebarProps {
	isCollapsed: boolean;
	onToggleCollapse: () => void;
	className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
	isCollapsed,
	onToggleCollapse,
	className = '',
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { logout } = useAuth();
	const permissions = usePermissions();
	const [expandedItems, setExpandedItems] = useState<string[]>([]);
	const [hoveredItem, setHoveredItem] = useState<string | null>(null);
	const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (hoverTimeout) {
				clearTimeout(hoverTimeout);
			}
		};
	}, [hoverTimeout]);

	const handleMouseEnter = (itemId: string) => {
		if (isCollapsed) {
			if (hoverTimeout) {
				clearTimeout(hoverTimeout);
				setHoverTimeout(null);
			}
			setHoveredItem(itemId);
		}
	};

	const handleMouseLeave = () => {
		if (isCollapsed) {
			const timeout = setTimeout(() => {
				setHoveredItem(null);
			}, 300);
			setHoverTimeout(timeout);
		}
	};

	// Get active item based on current route
	const getActiveItem = () => {
		const path = location.pathname;
		if (path === '/dashboard') return 'dashboard';
		if (path === '/presales') return 'presales';
		if (path === '/products') return 'products';
		if (path === '/customers') return 'customers';
		if (path === '/payment-methods') return 'payment-methods';
		if (path === '/users') return 'users';
		if (path === '/inventory') return 'inventory';
		if (path === '/settings') return 'settings';
		return 'dashboard';
	};

	const activeItem = getActiveItem();

	// Auto-expand parent menu if child is active
	useEffect(() => {
		const path = location.pathname;
		if (path.startsWith('/products') && !expandedItems.includes('cadastros')) {
			setExpandedItems((prev) => [...prev, 'cadastros']);
		}
		if (path.startsWith('/customers') && !expandedItems.includes('cadastros')) {
			setExpandedItems((prev) => [...prev, 'cadastros']);
		}
		if (
			path.startsWith('/payment-methods') &&
			!expandedItems.includes('cadastros')
		) {
			setExpandedItems((prev) => [...prev, 'cadastros']);
		}
		if (path.startsWith('/users') && !expandedItems.includes('cadastros')) {
			setExpandedItems((prev) => [...prev, 'cadastros']);
		}
		if (path.startsWith('/reports') && !expandedItems.includes('reports')) {
			setExpandedItems((prev) => [...prev, 'reports']);
		}
	}, [location.pathname, expandedItems]);

	// Filter menu items based on user permissions
	const getFilteredMenuItems = (): MenuItem[] => {
		const baseMenuItems: MenuItem[] = [
			{
				id: 'dashboard',
				label: 'Dashboard',
				icon: 'Home',
				path: '/dashboard',
			},
		];

		// Build Cadastros submenu based on permissions
		const cadastrosChildren: MenuItem[] = [];

		if (permissions.canAccessProducts()) {
			cadastrosChildren.push({
				id: 'products',
				label: 'Produtos',
				icon: 'Package',
				path: '/products',
			});
		}

		if (permissions.canAccessCustomers()) {
			cadastrosChildren.push({
				id: 'customers',
				label: 'Clientes',
				icon: 'Users',
				path: '/customers',
			});
		}

		if (permissions.canAccessPaymentMethods()) {
			cadastrosChildren.push({
				id: 'payment-methods',
				label: 'Formas de Pagamento',
				icon: 'CreditCard',
				path: '/payment-methods',
			});
		}

		if (permissions.canAccessUserManagement()) {
			cadastrosChildren.push({
				id: 'users',
				label: 'Usuários',
				icon: 'Users',
				path: '/users',
			});
		}

		// Only add Cadastros menu if user has access to at least one submenu
		if (cadastrosChildren.length > 0) {
			baseMenuItems.push({
				id: 'cadastros',
				label: 'Cadastros',
				icon: 'FileText',
				children: cadastrosChildren,
			});
		}

		// Add Pré-Vendas if user can access presales
		if (
			permissions.canCreatePresales() ||
			permissions.canViewOwnPresales() ||
			permissions.canViewAllPresales()
		) {
			baseMenuItems.push({
				id: 'presales',
				label: 'Pré-Vendas',
				icon: 'ShoppingCart',
				path: '/presales',
			});
		}

		// Add Estoque - for now, we'll show it to all authenticated users
		// This can be refined later with specific inventory permissions
		baseMenuItems.push({
			id: 'inventory',
			label: 'Estoque',
			icon: 'BarChart3',
			path: '/inventory',
		});

		// Add Relatórios if user has reports permission
		if (permissions.canAccessReports()) {
			baseMenuItems.push({
				id: 'reports',
				label: 'Relatórios',
				icon: 'FileText',
				path: '/reports',
			});
		}

		return baseMenuItems;
	};

	// Menu items configuration with permission filtering
	const menuItems: MenuItem[] = getFilteredMenuItems();

	// Bottom menu items
	const bottomMenuItems: MenuItem[] = [
		{
			id: 'logout',
			label: 'Sair',
			icon: 'LogOut',
			path: '/logout',
		},
	];

	// Icon mapping
	const iconMap = {
		Home,
		ShoppingCart,
		Users,
		Package,
		BarChart3,
		FileText,
		LogOut,
		CreditCard,
	};

	const toggleExpanded = (itemId: string) => {
		setExpandedItems((prev) =>
			prev.includes(itemId)
				? prev.filter((id) => id !== itemId)
				: [...prev, itemId],
		);
	};

	const isExpanded = (itemId: string) => expandedItems.includes(itemId);

	const renderIcon = (iconName?: string) => {
		if (!iconName) return null;
		const IconComponent = iconMap[iconName as keyof typeof iconMap];
		return IconComponent ? <IconComponent size={20} /> : null;
	};

	// Handle logout
	const handleLogout = async () => {
		await logout();
		navigate('/login');
	};

	const handleItemClick = (item: MenuItem) => {
		if (item.children && item.children.length > 0 && !isCollapsed) {
			toggleExpanded(item.id);
		} else if (item.path && (!item.children || item.children.length === 0)) {
			if (item.id === 'logout') {
				handleLogout();
			} else {
				navigate(item.path);
			}
		}
		// When collapsed and has children, do nothing - let hover handle it
	};

	const handleChildClick = (child: MenuItem, e?: React.MouseEvent) => {
		if (e) {
			e.stopPropagation();
		}
		if (child.path) {
			navigate(child.path);
		}
	};

	const renderMenuItem = (item: MenuItem, level = 0) => {
		const hasChildren = item.children && item.children.length > 0;
		const isItemExpanded = isExpanded(item.id);
		const isHovered = hoveredItem === item.id;
		const isActive = activeItem === item.id;
		const isParentActive =
			hasChildren && item.children?.some((child) => activeItem === child.id);

		return (
			<div key={item.id} className="relative">
				<div className="relative">
					{/* Main menu item */}
					<button
						type="button"
						data-menu-id={item.id}
						className={`
                            group flex items-center rounded-xl cursor-pointer 
                            transition-all duration-300 ease-in-out transform hover:scale-105
                            ${level === 0 ? 'px-4 py-3 mx-2 mb-1' : 'px-4 py-2 mx-6 mb-0.5'}
                            ${
															isActive && !hasChildren
																? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
																: isActive && level > 0
																	? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
																	: hasChildren &&
																			(isItemExpanded || isParentActive)
																		? 'bg-slate-800/50 text-blue-400'
																		: 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
														}
                            ${isCollapsed && level === 0 ? 'justify-center px-3 mx-2' : ''}
                            ${level > 0 ? 'text-sm' : ''}
                        `}
						aria-label={isCollapsed && level === 0 ? item.label : undefined}
						onClick={() => handleItemClick(item)}
						onMouseEnter={() => handleMouseEnter(item.id)}
						onMouseLeave={handleMouseLeave}
					>
						{/* Icon */}
						{level === 0 && (
							<div
								className={`
                            flex-shrink-0 transition-all duration-300
                            ${isActive && !hasChildren ? 'text-white' : 'text-slate-400 group-hover:text-white'}
                        `}
							>
								{renderIcon(item.icon)}
							</div>
						)}

						{/* Bullet point for submenu items */}
						{level > 0 && (
							<div
								className={`
                            w-2 h-2 rounded-full mr-3 flex-shrink-0 transition-all duration-300
                            ${isActive ? 'bg-blue-400' : 'bg-slate-500 group-hover:bg-slate-300'}
                        `}
							/>
						)}

						{/* Label */}
						{!isCollapsed && (
							<>
								<span
									className={`
                                flex-1 font-medium transition-all duration-300
                                ${level === 0 ? 'ml-3' : ''}
                                ${isActive && !hasChildren ? 'text-white' : ''}
                            `}
								>
									{item.label}
								</span>

								{/* Expand/Collapse icon for items with children */}
								{hasChildren && (
									<div
										className={`
                                    flex-shrink-0 ml-2 transition-all duration-300
                                    ${isItemExpanded ? 'rotate-180' : 'rotate-0'}
                                `}
									>
										<ChevronDown
											size={16}
											className={`
                                        transition-colors duration-300
                                        ${isItemExpanded ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}
                                    `}
										/>
									</div>
								)}
							</>
						)}

						{/* Active indicator */}
						{isActive && !hasChildren && !isCollapsed && (
							<div
								className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-1 bg-white rounded-l-full ${level === 0 ? 'h-8' : 'h-6'}`}
							/>
						)}
					</button>

					{/* Tooltip for collapsed state */}
					{isCollapsed && level === 0 && isHovered && (
						<div
							className={`
								absolute left-full ml-2 z-[60] pointer-events-auto
								${item.id === 'logout' ? 'bottom-0' : 'top-0'}
							`}
							onMouseEnter={() => {
								if (hoverTimeout) {
									clearTimeout(hoverTimeout);
									setHoverTimeout(null);
								}
							}}
							onMouseLeave={handleMouseLeave}
							role="tooltip"
						>
							<div className="bg-slate-800 border border-slate-600 text-white rounded-lg shadow-xl py-2 min-w-48">
								<div className="px-3 py-2 text-sm font-medium text-white border-b border-slate-600">
									{item.label}
								</div>
								{hasChildren && item.children
									? item.children.map((child) => (
											<button
												type="button"
												key={child.id}
												onClick={(e) => handleChildClick(child, e)}
												className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-200"
											>
												{child.label}
											</button>
										))
									: item.path && (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													if (item.id === 'logout') {
														handleLogout();
													} else {
														handleChildClick(item, e);
													}
												}}
												className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-200"
											>
												{item.id === 'logout'
													? item.label
													: `Acessar ${item.label}`}
											</button>
										)}
							</div>
							{/* Tooltip arrow */}
							<div
								className={`
								absolute w-2 h-2 bg-slate-800 border-l border-b border-slate-600 rotate-45
								${item.id === 'logout' ? 'left-0 bottom-4 transform -translate-x-1' : 'left-0 top-4 transform -translate-x-1'}
							`}
							/>
						</div>
					)}
				</div>

				{/* Submenu items with smooth animation */}
				{!isCollapsed && hasChildren && (
					<div
						className={`
                        overflow-hidden transition-all duration-300 ease-in-out
                        ${isItemExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                    `}
					>
						<div className="mt-1 space-y-1">
							{item.children?.map((child) => renderMenuItem(child, level + 1))}
						</div>
					</div>
				)}
			</div>
		);
	};

	return (
		<div
			className={`
                bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 
                border-r border-slate-700/50 backdrop-blur-xl
                transition-all duration-300 ease-in-out
                ${isCollapsed ? 'w-16' : 'w-64'}
                ${className}
                relative h-full flex flex-col
                ${isCollapsed ? 'overflow-visible' : 'overflow-hidden'}
            `}
		>
			{/* Background decoration */}
			<div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
			<div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

			{/* Header */}
			<div className="relative flex items-center justify-center p-4 border-b border-slate-700/50">
				{isCollapsed ? (
					// Estado collapsed - apenas o ícone do carrinho
					<button
						type="button"
						onClick={onToggleCollapse}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								onToggleCollapse();
							}
						}}
						className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
						aria-label="Expand sidebar"
					>
						<ShoppingCart size={18} className="text-white" />
					</button>
				) : (
					// Estado expandido - logo + título + botão de colapso
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center space-x-2">
							<div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
								<ShoppingCart size={18} className="text-white" />
							</div>
							<h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
								Minhas Vendas
							</h1>
						</div>
						<button
							type="button"
							onClick={onToggleCollapse}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									onToggleCollapse();
								}
							}}
							className="p-2 rounded-xl transition-all duration-300 hover:bg-slate-800/50 text-slate-400 hover:text-white hover:scale-110 active:scale-95"
							aria-label="Collapse sidebar"
						>
							<ChevronLeft
								size={20}
								className="text-slate-400 hover:text-white transition-colors"
							/>
						</button>
					</div>
				)}
			</div>

			{/* Navigation */}
			<div
				className={`relative flex flex-col flex-1 ${isCollapsed ? 'overflow-visible' : 'overflow-hidden'}`}
			>
				<nav
					className={`flex-1 py-4 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto'}`}
				>
					{menuItems.map((item) => renderMenuItem(item))}
				</nav>

				{/* Bottom menu */}
				<div className="border-t border-slate-700/50 py-4 flex-shrink-0">
					{bottomMenuItems.map((item) => renderMenuItem(item))}
				</div>
			</div>

			{/* Bottom decoration */}
			<div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
		</div>
	);
};

export default Sidebar;
