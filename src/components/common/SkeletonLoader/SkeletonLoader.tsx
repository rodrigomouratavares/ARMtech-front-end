import type React from 'react';

interface SkeletonLoaderProps {
	className?: string;
	width?: string | number;
	height?: string | number;
	variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
	animation?: 'pulse' | 'wave' | 'none';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
	className = '',
	width = '100%',
	height = '1rem',
	variant = 'text',
	animation = 'pulse',
}) => {
	const getVariantClasses = () => {
		switch (variant) {
			case 'circular':
				return 'rounded-full';
			case 'rounded':
				return 'rounded-md';
			case 'rectangular':
				return 'rounded-none';
			case 'text':
			default:
				return 'rounded';
		}
	};

	const getAnimationClasses = () => {
		switch (animation) {
			case 'wave':
				return 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[wave_1.5s_ease-in-out_infinite]';
			case 'pulse':
				return 'animate-pulse bg-gray-200';
			case 'none':
			default:
				return 'bg-gray-200';
		}
	};

	const style = {
		width: typeof width === 'number' ? `${width}px` : width,
		height: typeof height === 'number' ? `${height}px` : height,
	};

	return (
		<div
			className={`${getVariantClasses()} ${getAnimationClasses()} ${className}`}
			style={style}
			aria-label="Carregando..."
			role="status"
		/>
	);
};

// Predefined skeleton components for common use cases
export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({
	lines = 1,
	className = '',
}) => (
	<div className={`space-y-2 ${className}`}>
		{Array.from({ length: lines }).map((_, index) => (
			<SkeletonLoader
				key={index}
				height="1rem"
				width={index === lines - 1 ? '75%' : '100%'}
				variant="text"
			/>
		))}
	</div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({
	className = '',
}) => (
	<div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
		<div className="flex items-center space-x-4 mb-4">
			<SkeletonLoader variant="circular" width={40} height={40} />
			<div className="flex-1">
				<SkeletonLoader height="1rem" width="60%" className="mb-2" />
				<SkeletonLoader height="0.75rem" width="40%" />
			</div>
		</div>
		<TextSkeleton lines={3} />
	</div>
);

export const TableSkeleton: React.FC<{
	rows?: number;
	columns?: number;
	className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => (
	<div className={`space-y-4 ${className}`}>
		{/* Header */}
		<div
			className="grid gap-4"
			style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
		>
			{Array.from({ length: columns }).map((_, index) => (
				<SkeletonLoader key={`header-${index}`} height="1.5rem" />
			))}
		</div>

		{/* Rows */}
		{Array.from({ length: rows }).map((_, rowIndex) => (
			<div
				key={`row-${rowIndex}`}
				className="grid gap-4"
				style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
			>
				{Array.from({ length: columns }).map((_, colIndex) => (
					<SkeletonLoader key={`cell-${rowIndex}-${colIndex}`} height="1rem" />
				))}
			</div>
		))}
	</div>
);

export const ListSkeleton: React.FC<{
	items?: number;
	showAvatar?: boolean;
	className?: string;
}> = ({ items = 5, showAvatar = false, className = '' }) => (
	<div className={`space-y-4 ${className}`}>
		{Array.from({ length: items }).map((_, index) => (
			<div
				key={index}
				className="flex items-center space-x-4 p-3 border-b border-gray-100"
			>
				{showAvatar && (
					<SkeletonLoader variant="circular" width={32} height={32} />
				)}
				<div className="flex-1">
					<SkeletonLoader height="1rem" width="70%" className="mb-2" />
					<SkeletonLoader height="0.75rem" width="50%" />
				</div>
				<SkeletonLoader width={60} height="2rem" variant="rounded" />
			</div>
		))}
	</div>
);

export default SkeletonLoader;
