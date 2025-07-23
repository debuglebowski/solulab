import type { PersistentLabResult } from '@/core/types';
import { formatDuration } from '@/core/utils';
import { cn } from '@/app/utils/cn';

interface ComparisonMatrixProps {
    results: PersistentLabResult[];
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

function getValueColor(value: unknown, allValues: unknown[]): string {
    if (typeof value !== 'number' || allValues.length < 2) {
        return '';
    }

    const numericValues = allValues.filter((v) => typeof v === 'number');
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    if (value === min && min !== max) {
        return 'text-green-600 font-semibold';
    }

    if (value === max && min !== max) {
        return 'text-red-600 font-semibold';
    }

    return '';
}

export function ComparisonMatrix({
    results,
    propertyName,
    labName,
    caseName,
}: ComparisonMatrixProps) {
    const values = results.map((r) => parseResultValue(r.result, propertyName));

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

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Version
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Result
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {results.map((result, index) => {
                                const value = values[index];
                                const colorClass = getValueColor(value, values);

                                return (
                                    <tr key={result.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {result.versionName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <span className={cn('font-mono', colorClass)}>
                                                {formatValue(value)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDuration(result.duration)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {result.error ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Failed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Success
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Comparison Summary */}
                {values.every((v) => typeof v === 'number') && values.length > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Summary:</span>
                            {' Min: '}
                            <span className="text-green-600 font-mono">
                                {formatValue(Math.min(...values))}
                            </span>
                            {' | Max: '}
                            <span className="text-red-600 font-mono">
                                {formatValue(Math.max(...values))}
                            </span>
                            {' | Avg: '}
                            <span className="font-mono">
                                {formatValue(values.reduce((a, b) => a + b, 0) / values.length)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
