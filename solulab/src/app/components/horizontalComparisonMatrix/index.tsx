import React from 'react';
import type { PersistentLabResult } from '@/core/types';
import { formatDuration } from '@/core/utils';
import { cn } from '@/app/utils/cn';

interface HorizontalComparisonMatrixProps {
    results: PersistentLabResult[];
    selectedVersions: string[];
    propertyName?: string;
    labName?: string;
    caseName?: string;
}

function parseResultValue(result: string, propertyName?: string): unknown {
    try {
        const parsed = JSON.parse(result);

        if (propertyName && typeof parsed === 'object' && parsed !== null) {
            return parsed[propertyName];
        }

        return parsed;
    } catch {
        return result;
    }
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined) {
        return 'null';
    }

    if (typeof value === 'number') {
        return value.toLocaleString();
    }

    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }

    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
    }

    return String(value);
}

function ResultDisplay({ value }: { value: unknown }) {
    const [expanded, setExpanded] = React.useState(false);
    const formattedValue = formatValue(value);
    const isLongText = typeof value === 'string' && value.length > 200;
    const isObject = typeof value === 'object' && value !== null;
    const isMultiline = formattedValue.includes('\n') || isObject;
    
    const displayValue = expanded || !isLongText 
        ? formattedValue 
        : formattedValue.slice(0, 200) + '...';

    const handleCopy = () => {
        navigator.clipboard.writeText(formattedValue);
    };

    return (
        <div className="space-y-2">
            <div className={cn(
                "font-mono text-sm",
                isMultiline ? "whitespace-pre-wrap break-all" : "break-words",
                isMultiline && "bg-gray-100 p-3 rounded-md overflow-x-auto"
            )}>
                {displayValue}
            </div>
            <div className="flex gap-2">
                {isLongText && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                    >
                        {expanded ? 'Show less' : 'Show more'}
                    </button>
                )}
                <button
                    onClick={handleCopy}
                    className="text-xs text-gray-600 hover:text-gray-800"
                >
                    Copy
                </button>
            </div>
        </div>
    );
}

function getValueColor(value: unknown, allValues: unknown[]): string {
    if (typeof value !== 'number' || allValues.length < 2) {
        return '';
    }

    const numericValues = allValues.filter((v) => typeof v === 'number') as number[];
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    if (value === min && min !== max) {
        return 'text-green-600';
    }

    if (value === max && min !== max) {
        return 'text-red-600';
    }

    return '';
}

function getPercentageDiff(value: number, baseValue: number): string {
    if (baseValue === 0) return '0%';
    const diff = ((value - baseValue) / baseValue) * 100;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`;
}

export function HorizontalComparisonMatrix({
    results,
    selectedVersions,
    propertyName,
    labName,
    caseName,
}: HorizontalComparisonMatrixProps) {
    const filteredResults = results.filter((r) => selectedVersions.includes(r.versionName));
    const values = filteredResults.map((r) => parseResultValue(r.result, propertyName));
    const baseValue = typeof values[0] === 'number' ? values[0] : null;

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        {labName && caseName && (
                            <>
                                {labName} - {caseName}
                                {propertyName && (
                                    <span className="text-gray-600"> → {propertyName}</span>
                                )}
                            </>
                        )}
                    </h3>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {filteredResults.map((result, index) => {
                            const value = values[index];
                            const colorClass = getValueColor(value, values);

                            return (
                                <div
                                    key={result.id}
                                    className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-colors"
                                >
                                    <div className="mb-4">
                                        <h4 className="text-lg font-semibold text-gray-900">
                                            {result.versionName}
                                        </h4>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">
                                                Result
                                            </dt>
                                            <dd className="mt-1">
                                                {typeof value === 'number' ? (
                                                    <>
                                                        <span
                                                            className={cn(
                                                                'text-lg font-mono font-semibold',
                                                                colorClass
                                                            )}
                                                        >
                                                            {formatValue(value)}
                                                        </span>
                                                        {baseValue !== null &&
                                                            index > 0 && (
                                                                <span className="ml-2 text-sm text-gray-500">
                                                                    ({getPercentageDiff(value, baseValue)})
                                                                </span>
                                                            )}
                                                    </>
                                                ) : (
                                                    <ResultDisplay value={value} />
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">
                                                Duration
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {formatDuration(result.duration)}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">
                                                Status
                                            </dt>
                                            <dd className="mt-1">
                                                {result.error ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Failed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Success
                                                    </span>
                                                )}
                                            </dd>
                                        </div>

                                        {result.error && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">
                                                    Error
                                                </dt>
                                                <dd className="mt-1 text-sm text-red-600 font-mono">
                                                    {result.error}
                                                </dd>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {values.every((v) => typeof v === 'number') && values.length > 1 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Summary:</span>
                                {' Min: '}
                                <span className="text-green-600 font-mono font-semibold">
                                    {formatValue(Math.min(...(values as number[])))}
                                </span>
                                {' | Max: '}
                                <span className="text-red-600 font-mono font-semibold">
                                    {formatValue(Math.max(...(values as number[])))}
                                </span>
                                {' | Avg: '}
                                <span className="font-mono font-semibold">
                                    {formatValue(
                                        (values as number[]).reduce((a, b) => a + b, 0) /
                                            values.length
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}