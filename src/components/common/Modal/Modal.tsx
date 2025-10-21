import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import type { ModalProps } from '../../../types';

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
	const modalRef = useRef<HTMLDivElement>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);
	const modalTitleId = useId();

	useEffect(() => {
		if (isOpen) {
			// Store the currently focused element
			previousFocusRef.current = document.activeElement as HTMLElement;

			// Focus the modal
			modalRef.current?.focus();

			// Prevent body scroll
			document.body.style.overflow = 'hidden';
		} else {
			// Restore body scroll
			document.body.style.overflow = 'unset';

			// Restore focus to the previously focused element
			if (previousFocusRef.current) {
				previousFocusRef.current.focus();
			}
		}

		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
		}

		return () => {
			document.removeEventListener('keydown', handleEscape);
		};
	}, [isOpen, onClose]);

	const handleBackdropClick = () => {
		onClose();
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === 'Tab') {
			// Get all focusable elements within the modal
			const focusableElements = modalRef.current?.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);

			if (focusableElements && focusableElements.length > 0) {
				const firstElement = focusableElements[0] as HTMLElement;
				const lastElement = focusableElements[
					focusableElements.length - 1
				] as HTMLElement;

				if (event.shiftKey) {
					// Shift + Tab
					if (document.activeElement === firstElement) {
						event.preventDefault();
						lastElement.focus();
					}
				} else {
					// Tab
					if (document.activeElement === lastElement) {
						event.preventDefault();
						firstElement.focus();
					}
				}
			}
		}
	};

	if (!isOpen) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
			aria-labelledby={modalTitleId}
			role="dialog"
			aria-modal="true"
		>
			{/* Background overlay */}
			<div
				className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-out cursor-pointer"
				aria-hidden="true"
				onClick={handleBackdropClick}
			/>

			{/* Modal panel */}
			<div
				ref={modalRef}
				className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
				onKeyDown={handleKeyDown}
				tabIndex={-1}
				role="dialog"
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h3
						className="text-lg leading-6 font-medium text-gray-900"
						id={modalTitleId}
					>
						{title}
					</h3>
					<button
						type="button"
						className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						onClick={onClose}
						aria-label="Close modal"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">{children}</div>
			</div>
		</div>
	);
};

export default Modal;
