import type React from 'react';
import { cn } from '@/app/utils/cn';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
}

export function SelectField({
    label,
    options,
    placeholder = 'Choose an option...',
    className,
    id,
    ...props
}: SelectFieldProps) {
    const fieldId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <div className="space-y-2">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <div className="relative">
                <select
                    id={fieldId}
                    className={cn(
                        // Base styles
                        'block w-full appearance-none rounded-lg border bg-white px-4 py-2.5 pr-10',
                        // Border styles
                        'border-gray-200 hover:border-gray-300',
                        // Shadow and background
                        'shadow-sm hover:shadow-md transition-all duration-200',
                        // Focus styles
                        'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                        // Text styles
                        'text-gray-900 placeholder:text-gray-400',
                        // Disabled styles
                        'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
                        // Font
                        'text-sm font-medium',
                        className
                    )}
                    {...props}
                >
                    <option value="" className="text-gray-400">
                        {placeholder}
                    </option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value} className="text-gray-900">
                            {option.label}
                        </option>
                    ))}
                </select>
                {/* Custom chevron icon */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
}
