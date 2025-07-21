import { formatValue, isLongText } from '@/utils';

interface ResultValueProps {
    value: unknown;
    className?: string;
}

export function ResultValue({ value, className = '' }: ResultValueProps) {
    const formatted = formatValue(value);
    const isLong = isLongText(value);

    if (isLong) {
        return (
            <pre
                className={`whitespace-pre-wrap text-sm font-mono bg-gray-50 p-2 rounded max-h-40 overflow-y-auto ${className}`}
            >
                {formatted}
            </pre>
        );
    }

    return <span className={`font-mono text-sm ${className}`}>{formatted}</span>;
}
