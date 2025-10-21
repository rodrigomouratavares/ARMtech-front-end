import type React from 'react';
import { useEffect, useRef, useState } from 'react';

export interface SelectOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export interface SelectProps {
	value: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	placeholder?: string;
	label?: string;
	error?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
	size?: 'sm' | 'md' | 'lg';
}

const Select: React.FC<SelectProps> = ({
	value,
	onChange,
	options,
	placeholder = 'Selecione...',
	label,
	error,
	required,
	disabled,
	className = '',
	size = 'md',
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find((option) => option.value === value);

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-3 py-2 text-sm',
		lg: 'px-4 py-3 text-base',
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			setHighlightedIndex(-1);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (disabled) return;

		switch (e.key) {
			case 'Enter':
			case ' ':
				e.preventDefault();
				if (isOpen && highlightedIndex >= 0) {
					const selectedOption = options[highlightedIndex];
					if (!selectedOption.disabled) {
						onChange(selectedOption.value);
						setIsOpen(false);
					}
				} else {
					setIsOpen(!isOpen);
				}
				break;
			case 'ArrowDown':
				e.preventDefault();
				if (!isOpen) {
					setIsOpen(true);
				} else {
					setHighlightedIndex((prev) => {
						const nextIndex = prev < options.length - 1 ? prev + 1 : 0;
						return options[nextIndex]?.disabled ? nextIndex + 1 : nextIndex;
					});
				}
				break;
			case 'ArrowUp':
				e.preventDefault();
				if (!isOpen) {
					setIsOpen(true);
				} else {
					setHighlightedIndex((prev) => {
						const nextIndex = prev > 0 ? prev - 1 : options.length - 1;
						return options[nextIndex]?.disabled ? nextIndex - 1 : nextIndex;
					});
				}
				break;
			case 'Escape':
				setIsOpen(false);
				break;
		}
	};

	const handleOptionClick = (option: SelectOption) => {
		if (!option.disabled) {
			onChange(option.value);
			setIsOpen(false);
		}
	};

	return (
		<div className={`relative ${className}`} ref={containerRef}>
			{label && (
				<label className="block text-sm font-medium text-gray-700 mb-1">
					{label}
					{required && <span className="text-red-500 ml-1">*</span>}
				</label>
			)}

			<div
				role="combobox"
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				tabIndex={disabled ? -1 : 0}
				className={`
          relative w-full border border-gray-300 rounded-lg cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-colors duration-200
          ${sizeClasses[size]}
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
        `}
				onClick={() => !disabled && setIsOpen(!isOpen)}
				onKeyDown={handleKeyDown}
			>
				<div className="flex items-center justify-between">
					<span
						className={`block truncate ${!selectedOption ? 'text-gray-500' : 'text-gray-900'}`}
					>
						{selectedOption ? selectedOption.label : placeholder}
					</span>
					<svg
						className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>
			</div>

			{isOpen && (
				<div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
					<ul role="listbox" className="py-1">
						{options.map((option, index) => (
							<li
								key={option.value}
								role="option"
								aria-selected={option.value === value}
								className={`
                  px-3 py-2 text-sm cursor-pointer transition-colors duration-150
                  ${option.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'}
                  ${option.value === value ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                  ${index === highlightedIndex ? 'bg-gray-100' : ''}
                  ${!option.disabled && option.value !== value ? 'hover:bg-gray-50' : ''}
                `}
								onClick={() => handleOptionClick(option)}
								onMouseEnter={() => setHighlightedIndex(index)}
							>
								{option.label}
							</li>
						))}
					</ul>
				</div>
			)}

			{error && (
				<p className="mt-1 text-sm text-red-600" role="alert">
					{error}
				</p>
			)}
		</div>
	);
};

export default Select;
