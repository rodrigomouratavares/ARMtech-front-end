import type React from 'react';
import { useEffect, useState } from 'react';
import type { User } from '../../../types';
import SessionWarning from '../../common/SessionWarning';
import Header from '../Header';
import Sidebar from '../Sidebar';

interface LayoutProps {
	children: React.ReactNode;
	title?: string;
	user?: User;
	className?: string;
}

const Layout: React.FC<LayoutProps> = ({
	children,
	title = 'Dashboard',
	user,
	className = '',
}) => {
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

	// Check if screen is mobile size
	useEffect(() => {
		const checkMobile = () => {
			const mobile = window.innerWidth < 768; // md breakpoint
			setIsMobile(mobile);

			// Auto-collapse sidebar on mobile and close mobile sidebar
			if (mobile) {
				setIsSidebarCollapsed(true);
				setIsMobileSidebarOpen(false);
			}
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	const handleSidebarToggle = () => {
		if (isMobile) {
			setIsMobileSidebarOpen(prev => !prev);
		} else {
			setIsSidebarCollapsed(prev => !prev);
		}
	};

	const handleMobileOverlayClick = () => {
		if (isMobile) {
			setIsMobileSidebarOpen(false);
		}
	};

	// Close sidebar when clicking outside on mobile
	useEffect(() => {
		if (isMobile && isMobileSidebarOpen) {
			const handleClickOutside = (event: MouseEvent) => {
				const sidebar = document.querySelector('.sidebar-mobile');
				if (sidebar && !sidebar.contains(event.target as Node)) {
					setIsMobileSidebarOpen(false);
				}
			};

			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
	}, [isMobile, isMobileSidebarOpen]);

	return (
		<div className={`min-h-screen bg-gray-50 ${className}`}>
			{/* Session Warning */}
			<SessionWarning />



			{/* Sidebar */}
			<div
				className={`
          fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out
          ${
						isMobile
							? isMobileSidebarOpen
								? 'translate-x-0'
								: '-translate-x-full'
							: 'translate-x-0'
					}
        `}
			>
				<Sidebar
					isCollapsed={isSidebarCollapsed && !isMobile}
					onToggleCollapse={handleSidebarToggle}
					className={`h-full ${isMobile ? 'sidebar-mobile shadow-2xl' : 'shadow-lg'}`}
				/>
			</div>

			{/* Main content area */}
			<div
				className={`
          transition-all duration-300 ease-in-out main-with-sidebar min-h-screen
          ${isMobile ? 'ml-0 w-full' : isSidebarCollapsed ? 'ml-16' : 'ml-64'}
        `}
				style={isMobile ? { marginLeft: 0, width: '100%' } : {}}
			>
				{/* Header */}
				<Header 
					title={title} 
					user={user} 
					className="sticky top-0 z-20" 
					onMobileMenuToggle={isMobile ? handleSidebarToggle : undefined}
				/>

				{/* Page content */}
				<main className="main-content responsive-p-4 sm:p-6 w-full">
					<div className="w-full max-w-none">{children}</div>
				</main>
			</div>
		</div>
	);
};

export default Layout;
