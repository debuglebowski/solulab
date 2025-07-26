import React from 'react';
import { Dropdown, DropdownOption } from '@/app/components/dropdown';

interface SelectFieldProps {
    label: string;
    options: Array<{ value: string; label: string }>;
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    id?: string;
    disabled?: boolean;
}

export function SelectField({
    label,
    options,
    value = '',
    onChange,
    placeholder = 'Choose an option...',
    className,
    id,
    disabled = false,
}: SelectFieldProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Ensure value is set to first option if no value provided
    const effectiveValue = value === '' && options.length > 0 ? options[0].value : value;
    
    // Find the label for the current value
    const selectedOption = options.find(opt => opt.value === effectiveValue);
    const displayValue = selectedOption ? selectedOption.label : '';

    const handleSelect = (optionValue: string) => {
        if (onChange) {
            onChange(optionValue);
        }
        setIsOpen(false);
    };

    return (
        <Dropdown
            label={label}
            placeholder={placeholder}
            value={effectiveValue}
            displayValue={displayValue}
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            onClose={() => setIsOpen(false)}
            className={className}
            id={id}
            disabled={disabled}
        >
            {options.map((option) => (
                <DropdownOption
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    isSelected={option.value === effectiveValue}
                    onClick={() => handleSelect(option.value)}
                />
            ))}
        </Dropdown>
    );
}
