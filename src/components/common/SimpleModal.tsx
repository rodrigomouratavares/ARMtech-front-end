import type React from 'react';
import type { ModalProps } from '../../types';

const SimpleModal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	title,
	children,
}) => {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
				{/* Background overlay */}
				<div
					className="fixed inset-0 bg-gray-500 bg-opacity-75"
					onClick={onClose}
				/>

				{/* Modal content */}
				<div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
					{/* Header */}
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-medium text-gray-900">{title}</h3>
						<button
							type="button"
							className="text-gray-400 hover:text-gray-600"
							onClick={onClose}
						>
							×
						</button>
					</div>

					{/* Content */}
					<div>{children}</div>
				</div>
			</div>
		</div>
	);
};

export default SimpleModal;
