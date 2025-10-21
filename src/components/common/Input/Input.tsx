import type React from 'react';
import { forwardRef, useId } from 'react';
import type { InputProps } from '../../../types';

const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			type = 'text',
			placeholder,
			value,
			onChange,
			error,
			label,
			required = false,
			...props
		},
		ref,
	) => {
		const baseClasses =
			'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors';

		const stateClasses = error
			? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
			: 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500';

		const classes = `${baseClasses} ${stateClasses}`;

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange(e.target.value);
		};

		const generatedId = useId();
		const inputId = props.id || generatedId;

		return (
			<div className="w-full">
				{label && (
					<label
						htmlFor={inputId}
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						{label}
						{required && <span className="text-red-500 ml-1">*</span>}
					</label>
				)}
				<input
					ref={ref}
					id={inputId}
					type={type}
					placeholder={placeholder}
					value={value}
					onChange={handleChange}
					className={classes}
					aria-invalid={error ? 'true' : 'false'}
					aria-describedby={error ? `${inputId}-error` : undefined}
					required={required}
					{...props}
				/>
				{error && (
					<p
						id={`${inputId}-error`}
						className="mt-1 text-sm text-red-600"
						role="alert"
					>
						{error}
					</p>
				)}
			</div>
		);
	},
);

Input.displayName = 'Input';

export default Input;
