import React from 'react';
import { cn } from '@/app/utils/cn';

interface DropdownProps {
    label: string;
    placeholder?: string;
    value?: string;
    displayValue: string;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    id?: string;
    disabled?: boolean;
}

export function Dropdown({
    label,
    placeholder = 'Choose an option...',
    value,
    displayValue,
    isOpen,
    onToggle,
    onClose,
    children,
    className,
    id,
    disabled = false,
}: DropdownProps) {
    const fieldId = id || `dropdown-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
        return undefined;
    }, [isOpen, onClose]);

    return (
        <div className="space-y-2" ref={dropdownRef}>
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <div className="relative">
                <button
                    id={fieldId}
                    type="button"
                    onClick={onToggle}
                    disabled={disabled}
                    className={cn(
                        // Base styles
                        'block w-full appearance-none rounded-lg border bg-white px-4 py-2.5 pr-10 text-left',
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
                >
                    <span className={!value && !displayValue ? 'text-gray-400' : ''}>
                        {displayValue || placeholder}
                    </span>
                </button>
                
                {/* Custom chevron icon */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                        className={cn('h-5 w-5 text-gray-400 transition-transform', isOpen && 'rotate-180')}
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

                {/* Dropdown panel */}
                {isOpen && !disabled && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                        <div className="max-h-60 overflow-auto py-1">
                            {children}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

interface DropdownOptionProps {
    value: string;
    label: string;
    isSelected: boolean;
    onClick: () => void;
    disabled?: boolean;
}

export function DropdownOption({ label, isSelected, onClick, disabled = false }: DropdownOptionProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'w-full px-4 py-2 text-left text-sm transition-colors',
                isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-900 hover:bg-gray-50',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            {label}
        </button>
    );
}