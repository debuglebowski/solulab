import React from 'react';
import type { PersistentLabResult } from '@/core/types';
import { formatDuration } from '@/core/utils';
import { cn } from '@/app/utils/cn';

interface TableComparisonMatrixProps {
    results: PersistentLabResult[];
    selectedVersions: string[];
}

function parseResultValue(result: string): unknown {
    try {
        return JSON.parse(result);
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

function getPercentageDiff(value: number, baseValue: number): string {
    if (baseValue === 0) return '0%';
    const diff = ((value - baseValue) / baseValue) * 100;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(0)}%`;
}

interface ResultCellProps {
    result: PersistentLabResult;
    value: unknown;
    baseValue: unknown;
    isFirst: boolean;
    isBest: boolean;
    allValues: unknown[];
    expanded: boolean;
    onToggleExpand: () => void;
}

function ResultCell({ result, value, baseValue, isFirst, isBest, expanded, onToggleExpand }: ResultCellProps) {
    const [showCopied, setShowCopied] = React.useState(false);
    const formattedValue = formatValue(value);
    const isNumber = typeof value === 'number';
    const isLongText = formattedValue.length > 100;

    const displayValue = expanded || !isLongText 
        ? formattedValue 
        : formattedValue.slice(0, 100) + '...';

    const handleCopy = () => {
        const textToCopy = result.error ? result.error : formattedValue;
        navigator.clipboard.writeText(textToCopy);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    const percentDiff = isNumber && !isFirst && typeof baseValue === 'number'
        ? getPercentageDiff(value, baseValue)
        : null;

    // Simple error cell
    if (result.error) {
        return (
            <div className="px-6 py-4 border-r border-gray-200 bg-red-50 hover:bg-red-100">
                <div className="space-y-2">
                    <div className="text-red-700 font-medium">
                        ✗ Failed
                    </div>
                    <div className="text-sm text-red-600 font-mono">
                        {result.error}
                    </div>
                </div>
            </div>
        );
    }

    // Success cell with metadata bar
    return (
        <div className="relative p-0 border-r border-gray-200 hover:bg-gray-50 group">
            <div className="flex flex-col h-full">
                {/* Main content area */}
                <div className="flex-1 px-6 py-4">
                    <div className={cn(
                        isNumber ? 'text-2xl font-bold' : 'text-sm',
                        isNumber && 'font-mono',
                        !isNumber && formattedValue.includes('\n') && 'whitespace-pre-wrap font-mono bg-gray-100 p-2 rounded'
                    )}>
                        {displayValue}
                    </div>
                    {percentDiff && (
                        <div className={cn(
                            'text-sm mt-1',
                            percentDiff.startsWith('+') ? 'text-red-600' : 'text-green-600'
                        )}>
                            {percentDiff}
                        </div>
                    )}
                </div>

                {/* Subtle metadata bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50/50 border-t border-gray-100 text-xs">
                    {/* Left: Status and duration */}
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600">
                            <span className="text-green-600">✓</span> {formatDuration(result.duration)}
                        </span>
                        
                        {/* Best badge */}
                        {isBest && isNumber && (
                            <span className="text-amber-600 font-medium">🏆 Best</span>
                        )}
                    </div>

                    {/* Right: Action buttons */}
                    <div className="flex items-center gap-2 text-gray-500">
                        <button
                            onClick={handleCopy}
                            className="hover:text-blue-600 transition-colors"
                        >
                            {showCopied ? 'Copied' : 'Copy'}
                        </button>
                        {isLongText && (
                            <>
                                <span className="text-gray-300">|</span>
                                <button
                                    onClick={onToggleExpand}
                                    className="hover:text-blue-600 transition-colors"
                                >
                                    {expanded ? 'Collapse' : 'Expand'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TableComparisonMatrix({
    results,
    selectedVersions,
}: TableComparisonMatrixProps) {
    // Row expansion state
    const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});

    const toggleRowExpansion = (caseName: string) => {
        setExpandedRows(prev => ({
            ...prev,
            [caseName]: !prev[caseName]
        }));
    };

    // Group results by case
    const resultsByCase = React.useMemo(() => {
        const grouped = new Map<string, PersistentLabResult[]>();
        
        results.forEach(result => {
            if (selectedVersions.includes(result.versionName)) {
                const existing = grouped.get(result.caseName) || [];
                grouped.set(result.caseName, [...existing, result]);
            }
        });

        // Sort results within each case by version order
        grouped.forEach((caseResults, caseName) => {
            grouped.set(caseName, caseResults.sort((a, b) => 
                selectedVersions.indexOf(a.versionName) - selectedVersions.indexOf(b.versionName)
            ));
        });

        return grouped;
    }, [results, selectedVersions]);

    const cases = Array.from(resultsByCase.keys()).sort();

    if (cases.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No results found for the selected versions.
            </div>
        );
    }

    // Create grid template columns: fixed width for first column, equal width for rest
    const gridTemplateColumns = `12rem ${selectedVersions.map(() => '1fr').join(' ')}`;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <div className="min-w-full">
                    {/* Header */}
                    <div 
                        className="grid bg-blue-50 border-b border-gray-200"
                        style={{ gridTemplateColumns }}
                    >
                        <div className="sticky left-0 z-20 bg-blue-50 px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <div className="flex items-center justify-between">
                                <span>Cases ↓</span>
                                <span>Versions →</span>
                            </div>
                        </div>
                        {selectedVersions.map(version => (
                            <div
                                key={version}
                                className="px-6 py-3 text-center text-sm font-semibold text-blue-900 bg-blue-50 border-r border-gray-200"
                            >
                                {version}
                            </div>
                        ))}
                    </div>
                    {/* Body */}
                    {cases.map(caseName => {
                        const caseResults = resultsByCase.get(caseName) || [];
                        const values = caseResults.map(r => parseResultValue(r.result));
                        const baseValue = values[0];
                        
                        // Determine best value for numeric results
                        let bestIndex = -1;
                        if (values.every(v => typeof v === 'number')) {
                            const numValues = values as number[];
                            // For most metrics, lower is better (like duration)
                            // This could be made configurable based on the property name
                            bestIndex = numValues.indexOf(Math.min(...numValues));
                        }

                        return (
                            <div 
                                key={caseName} 
                                className="grid hover:bg-gray-50 group border-b border-gray-200"
                                style={{ gridTemplateColumns }}
                            >
                                <div className="sticky left-0 z-10 bg-orange-50 px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-800 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-orange-100">
                                    {caseName}
                                </div>
                                {selectedVersions.map((version, index) => {
                                    const result = caseResults.find(r => r.versionName === version);
                                    if (!result) {
                                        return (
                                            <div key={version} className="px-6 py-4 text-gray-400 text-center border-r border-gray-200">
                                                No data
                                            </div>
                                        );
                                    }

                                    return (
                                        <ResultCell
                                            key={version}
                                            result={result}
                                            value={values[index]}
                                            baseValue={baseValue}
                                            isFirst={index === 0}
                                            isBest={index === bestIndex}
                                            allValues={values}
                                            expanded={expandedRows[caseName] || false}
                                            onToggleExpand={() => toggleRowExpansion(caseName)}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        
        {/* Summary for numeric values */}
        {cases.length > 0 && (() => {
            const firstCaseResults = resultsByCase.get(cases[0]) || [];
            const firstCaseValues = firstCaseResults.map(r => parseResultValue(r.result));
            const allNumeric = firstCaseValues.every(v => typeof v === 'number');
            
            if (allNumeric && selectedVersions.length > 1) {
                return (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                        <span className="font-medium">Summary across all cases:</span>
                        <span className="ml-4">Compare {cases.length} cases × {selectedVersions.length} versions</span>
                    </div>
                );
            }
            return null;
        })()}
    </div>
    );
}