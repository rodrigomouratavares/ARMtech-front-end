import type React from 'react';
import { useId } from 'react';

export interface CheckboxOption {
	value: string;
	label: string;
	description?: string;
	disabled?: boolean;
}

export interface CheckboxGroupProps {
	value: string;
	onChange: (value: string) => void;
	options: CheckboxOption[];
	label?: string;
	error?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
	direction?: 'horizontal' | 'vertical';
	name?: string; // Optional custom name for the radio group
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
	value,
	onChange,
	options,
	label,
	error,
	required,
	disabled,
	className = '',
	direction = 'horizontal',
	name,
}) => {
	// Generate unique ID for this group if name is not provided
	const uniqueId = useId();
	const groupName = name || `checkbox-group-${uniqueId}`;

	const handleOptionChange = (
		eventOrValue: string | React.ChangeEvent<HTMLInputElement>,
	) => {
		if (disabled) return;

		if (typeof eventOrValue === 'string') {
			onChange(eventOrValue);
		} else if (eventOrValue && eventOrValue.target) {
			onChange(eventOrValue.target.value);
		}
	};

	const directionClasses = {
		horizontal: 'flex flex-wrap gap-4',
		vertical: 'flex flex-col space-y-3',
	};

	return (
		<div className={`${className}`}>
			{label && (
				<label className="block text-sm font-medium text-gray-700 mb-3">
					{label}
					{required && <span className="text-red-500 ml-1">*</span>}
				</label>
			)}

			<div className={directionClasses[direction]}>
				{options.map((option) => {
					const isSelected = value === option.value;
					const isDisabled = disabled || option.disabled;

					return (
						<label
							key={option.value}
							className={`
                relative flex items-center cursor-pointer select-none
                ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
              `}
						>
							<input
								type="radio"
								name={groupName}
								value={option.value}
								checked={isSelected}
								onChange={(e) => handleOptionChange(e)}
								disabled={isDisabled}
								className="sr-only"
							/>

							{/* Custom checkbox design */}
							<div
								className={`
                  relative w-5 h-5 rounded border-2 transition-all duration-200 mr-3
                  ${
										isSelected
											? 'bg-blue-600 border-blue-600'
											: 'bg-white border-gray-300 hover:border-blue-400'
									}
                  ${isDisabled ? 'bg-gray-100 border-gray-300' : ''}
                `}
							>
								{isSelected && (
									<svg
										className="absolute inset-0 w-full h-full text-white"
										viewBox="0 0 16 16"
										fill="currentColor"
									>
										<path d="M13.854 3.646a.5.5 0 0 1 0 .708L6.207 11.854a.5.5 0 0 1-.708 0L2.146 8.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708 0z" />
									</svg>
								)}
							</div>

							{/* Label and description */}
							<div className="flex flex-col">
								<span
									className={`text-sm font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}
								>
									{option.label}
								</span>
								{option.description && (
									<span
										className={`text-xs ${isDisabled ? 'text-gray-300' : 'text-gray-500'}`}
									>
										{option.description}
									</span>
								)}
							</div>
						</label>
					);
				})}
			</div>

			{error && (
				<p className="mt-2 text-sm text-red-600" role="alert">
					{error}
				</p>
			)}
		</div>
	);
};

export default CheckboxGroup;
