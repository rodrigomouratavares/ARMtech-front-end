import type React from 'react';

interface ProgressIndicatorProps {
	progress?: number; // 0-100
	size?: 'sm' | 'md' | 'lg';
	variant?: 'linear' | 'circular' | 'dots';
	color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
	showPercentage?: boolean;
	className?: string;
	label?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
	progress = 0,
	size = 'md',
	variant = 'linear',
	color = 'primary',
	showPercentage = false,
	className = '',
	label,
}) => {
	const getSizeClasses = () => {
		switch (size) {
			case 'sm':
				return variant === 'circular' ? 'w-4 h-4' : 'h-1';
			case 'lg':
				return variant === 'circular' ? 'w-12 h-12' : 'h-3';
			case 'md':
			default:
				return variant === 'circular' ? 'w-8 h-8' : 'h-2';
		}
	};

	const getColorClasses = () => {
		switch (color) {
			case 'secondary':
				return 'text-gray-600';
			case 'success':
				return 'text-green-600';
			case 'warning':
				return 'text-yellow-600';
			case 'error':
				return 'text-red-600';
			case 'primary':
			default:
				return 'text-blue-600';
		}
	};

	const getProgressBarColor = () => {
		switch (color) {
			case 'secondary':
				return 'bg-gray-600';
			case 'success':
				return 'bg-green-600';
			case 'warning':
				return 'bg-yellow-600';
			case 'error':
				return 'bg-red-600';
			case 'primary':
			default:
				return 'bg-blue-600';
		}
	};

	if (variant === 'circular') {
		const circumference = 2 * Math.PI * 16; // radius = 16
		const strokeDashoffset = circumference - (progress / 100) * circumference;

		return (
			<div className={`inline-flex items-center justify-center ${className}`}>
				<div className={`relative ${getSizeClasses()}`}>
					<svg
						className="transform -rotate-90 w-full h-full"
						viewBox="0 0 36 36"
						aria-label={label || `Progresso: ${progress}%`}
					>
						<path
							className="stroke-gray-200"
							strokeWidth="3"
							fill="none"
							d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
						/>
						<path
							className={`stroke-current ${getColorClasses()}`}
							strokeWidth="3"
							strokeLinecap="round"
							fill="none"
							strokeDasharray={`${circumference} ${circumference}`}
							strokeDashoffset={strokeDashoffset}
							d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
							style={{
								transition: 'stroke-dashoffset 0.3s ease-in-out',
							}}
						/>
					</svg>
					{showPercentage && (
						<div className="absolute inset-0 flex items-center justify-center">
							<span className={`text-xs font-medium ${getColorClasses()}`}>
								{Math.round(progress)}%
							</span>
						</div>
					)}
				</div>
			</div>
		);
	}

	if (variant === 'dots') {
		return (
			<div className={`flex items-center space-x-1 ${className}`}>
				{Array.from({ length: 3 }).map((_, index) => (
					<div
						key={index}
						className={`${getSizeClasses()} w-2 rounded-full ${getProgressBarColor()} animate-pulse`}
						style={{
							animationDelay: `${index * 0.2}s`,
							animationDuration: '1s',
						}}
					/>
				))}
				{label && <span className="ml-2 text-sm text-gray-600">{label}</span>}
			</div>
		);
	}

	// Linear progress bar (default)
	return (
		<div className={`w-full ${className}`}>
			{(label || showPercentage) && (
				<div className="flex justify-between items-center mb-1">
					{label && <span className="text-sm text-gray-600">{label}</span>}
					{showPercentage && (
						<span className="text-sm text-gray-600">
							{Math.round(progress)}%
						</span>
					)}
				</div>
			)}
			<div className={`w-full bg-gray-200 rounded-full ${getSizeClasses()}`}>
				<div
					className={`${getProgressBarColor()} ${getSizeClasses()} rounded-full transition-all duration-300 ease-out`}
					style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
					role="progressbar"
					aria-valuenow={progress}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label={label || `Progresso: ${progress}%`}
				/>
			</div>
		</div>
	);
};

// Indeterminate loading spinner
export const LoadingSpinner: React.FC<{
	size?: 'sm' | 'md' | 'lg';
	color?: 'primary' | 'secondary' | 'white';
	className?: string;
}> = ({ size = 'md', color = 'primary', className = '' }) => {
	const getSizeClasses = () => {
		switch (size) {
			case 'sm':
				return 'w-4 h-4';
			case 'lg':
				return 'w-8 h-8';
			case 'md':
			default:
				return 'w-6 h-6';
		}
	};

	const getColorClasses = () => {
		switch (color) {
			case 'secondary':
				return 'text-gray-600';
			case 'white':
				return 'text-white';
			case 'primary':
			default:
				return 'text-blue-600';
		}
	};

	return (
		<svg
			className={`animate-spin ${getSizeClasses()} ${getColorClasses()} ${className}`}
			fill="none"
			viewBox="0 0 24 24"
			aria-label="Carregando"
		>
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
	);
};

// Button with loading state
export const LoadingButton: React.FC<{
	loading?: boolean;
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	variant?: 'primary' | 'secondary' | 'outline';
	size?: 'sm' | 'md' | 'lg';
	className?: string;
	type?: 'button' | 'submit' | 'reset';
}> = ({
	loading = false,
	children,
	onClick,
	disabled = false,
	variant = 'primary',
	size = 'md',
	className = '',
	type = 'button',
}) => {
	const getVariantClasses = () => {
		switch (variant) {
			case 'secondary':
				return 'bg-gray-600 hover:bg-gray-700 text-white';
			case 'outline':
				return 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700';
			case 'primary':
			default:
				return 'bg-blue-600 hover:bg-blue-700 text-white';
		}
	};

	const getSizeClasses = () => {
		switch (size) {
			case 'sm':
				return 'px-3 py-1.5 text-sm';
			case 'lg':
				return 'px-6 py-3 text-lg';
			case 'md':
			default:
				return 'px-4 py-2 text-base';
		}
	};

	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled || loading}
			className={`
        inline-flex items-center justify-center
        font-medium rounded-md
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
		>
			{loading && (
				<LoadingSpinner
					size="sm"
					color={variant === 'outline' ? 'primary' : 'white'}
					className="mr-2"
				/>
			)}
			{children}
		</button>
	);
};

export default ProgressIndicator;
