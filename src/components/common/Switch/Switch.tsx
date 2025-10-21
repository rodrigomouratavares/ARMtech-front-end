import type React from 'react';

export interface SwitchProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label?: string;
	description?: string;
	disabled?: boolean;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

const Switch: React.FC<SwitchProps> = ({
	checked,
	onChange,
	label,
	description,
	disabled = false,
	size = 'md',
	className = '',
}) => {
	const sizeClasses = {
		sm: {
			switch: 'h-4 w-7',
			thumb: 'h-3 w-3',
			translate: 'translate-x-3',
		},
		md: {
			switch: 'h-5 w-9',
			thumb: 'h-4 w-4',
			translate: 'translate-x-4',
		},
		lg: {
			switch: 'h-6 w-11',
			thumb: 'h-5 w-5',
			translate: 'translate-x-5',
		},
	};

	const currentSize = sizeClasses[size];

	const handleToggle = () => {
		if (!disabled) {
			onChange(!checked);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			handleToggle();
		}
	};

	return (
		<div className={`flex items-start space-x-3 ${className}`}>
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				aria-disabled={disabled}
				onClick={handleToggle}
				onKeyDown={handleKeyDown}
				disabled={disabled}
				className={`
					relative inline-flex items-center ${currentSize.switch} rounded-full
					transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
					${
						checked
							? 'bg-blue-600 hover:bg-blue-700'
							: 'bg-gray-200 hover:bg-gray-300'
					}
					${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
				`}
			>
				<span
					className={`
						${currentSize.thumb} inline-block rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out
						${checked ? currentSize.translate : 'translate-x-0.5'}
					`}
				/>
			</button>

			{(label || description) && (
				<div className="flex-1">
					{label && (
						<label
							className={`
								block text-sm font-medium text-gray-700 cursor-pointer
								${disabled ? 'opacity-50' : ''}
							`}
							onClick={handleToggle}
							onKeyDown={(e) => {
								if (e.key === ' ' || e.key === 'Enter') {
									e.preventDefault();
									handleToggle();
								}
							}}
							tabIndex={0}
							role="button"
						>
							{label}
						</label>
					)}
					{description && (
						<p
							className={`
								text-sm text-gray-500 mt-1
								${disabled ? 'opacity-50' : ''}
							`}
						>
							{description}
						</p>
					)}
				</div>
			)}
		</div>
	);
};

export default Switch;
