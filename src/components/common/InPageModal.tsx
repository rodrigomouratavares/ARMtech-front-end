import type React from 'react';
import { useEffect, useState } from 'react';
import type { ModalProps } from '../../types';

const InPageModal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	title,
	children,
}) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsVisible(true);
		} else {
			// Delay hiding to allow exit animation
			const timer = setTimeout(() => setIsVisible(false), 200);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	if (!isVisible) {
		return null;
	}

	return (
		<div
			className={`
				fixed z-50 transition-all duration-200 ease-in-out
				${isOpen ? 'opacity-100' : 'opacity-0'}
				/* Desktop: respeitar sidebar e header */
				xl:top-16 xl:left-64 xl:right-0 xl:bottom-0
				/* Mobile e Tablet: tela toda */
				inset-0 xl:inset-auto
			`}
		>
			{/* Background com blur */}
			<div
				className={`
					absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30
					transition-all duration-200 ease-in-out
					${isOpen ? 'opacity-100' : 'opacity-0'}
				`}
				onClick={onClose}
			/>

			{/* Container do modal */}
			<div className="relative flex items-start justify-center min-h-full p-2 sm:p-4 md:p-6">
				<div
					className={`
						relative bg-white/95 backdrop-blur-md rounded-lg shadow-2xl
						border border-gray-200/50 w-full flex flex-col
						/* Responsivo: ajusta conforme tamanho da tela */
						max-w-[98vw] max-h-[98vh] 
						sm:max-w-[95vw] sm:max-h-[95vh] 
						md:max-w-4xl md:max-h-[90vh] 
						lg:max-w-5xl lg:max-h-[85vh]
						xl:max-w-4xl xl:max-h-[calc(100vh-8rem)]
						my-2 sm:my-4 md:my-6
						transition-all duration-200 ease-in-out transform
						${
							isOpen
								? 'opacity-100 scale-100 translate-y-0'
								: 'opacity-0 scale-95 translate-y-4'
						}
					`}
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="flex-shrink-0 px-6 py-4 border-b border-gray-200/50 bg-gray-50/50 rounded-t-lg">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
							<button
								type="button"
								className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-150"
								onClick={onClose}
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="overflow-y-auto flex-1 min-h-0">{children}</div>
				</div>
			</div>
		</div>
	);
};

export default InPageModal;
