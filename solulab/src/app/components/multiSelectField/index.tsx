import React from 'react';
import { cn } from '@/app/utils/cn';
import { Dropdown } from '@/app/components/dropdown';

interface MultiSelectFieldProps {
    label: string;
    options: string[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    maxSelections?: number;
    className?: string;
    id?: string;
}

export function MultiSelectField({
    label,
    options,
    selectedValues,
    onChange,
    placeholder = 'Select options...',
    maxSelections = 3,
    className,
    id,
}: MultiSelectFieldProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleToggleOption = (option: string) => {
        if (selectedValues.includes(option)) {
            onChange(selectedValues.filter(v => v !== option));
        } else if (selectedValues.length < maxSelections) {
            onChange([...selectedValues, option]);
        }
    };

    const displayValue = React.useMemo(() => {
        if (selectedValues.length === 0) {
            return '';
        }
        
        if (selectedValues.length <= 3) {
            return selectedValues.join(', ');
        }
        
        return `${selectedValues.slice(0, 3).join(', ')}, +${selectedValues.length - 3} more`;
    }, [selectedValues]);

    return (
        <Dropdown
            label={label}
            placeholder={placeholder}
            value={selectedValues.join(',')}
            displayValue={displayValue}
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            onClose={() => setIsOpen(false)}
            className={className}
            id={id}
        >
            <>
                {options.map((option) => {
                    const isSelected = selectedValues.includes(option);
                    const isDisabled = !isSelected && selectedValues.length >= maxSelections;

                    return (
                        <label
                            key={option}
                            className={cn(
                                'flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-50',
                                isDisabled && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleOption(option)}
                                disabled={isDisabled}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-3 text-gray-900">{option}</span>
                        </label>
                    );
                })}
                {selectedValues.length >= maxSelections && (
                    <div className="px-4 py-2 text-xs text-amber-600 bg-amber-50 border-t border-amber-100">
                        Maximum {maxSelections} selections allowed
                    </div>
                )}
            </>
        </Dropdown>
    );
}