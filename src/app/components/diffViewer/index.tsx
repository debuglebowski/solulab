import * as Diff from 'diff';
import { formatValue } from '@/core/utils';

interface DiffViewerProps {
    oldValue: unknown;
    newValue: unknown;
}

export function DiffViewer({ oldValue, newValue }: DiffViewerProps) {
    const oldStr = formatValue(oldValue);
    const newStr = formatValue(newValue);

    if (typeof oldValue === 'string' && typeof newValue === 'string' && oldValue.length > 50) {
        const diff = Diff.diffLines(oldStr, newStr);

        return (
            <div className="font-mono text-sm">
                {diff.map((part, index) => (
                    <div
                        key={`${index}-${part.added ? 'add' : part.removed ? 'rem' : 'same'}-${part.value.slice(0, 20)}`}
                        className={
                            part.added
                                ? 'bg-green-100 text-green-800'
                                : part.removed
                                  ? 'bg-red-100 text-red-800'
                                  : ''
                        }
                    >
                        <pre className="whitespace-pre-wrap">
                            {part.added ? '+ ' : part.removed ? '- ' : '  '}
                            {part.value}
                        </pre>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-2">
                <span className="text-red-600">Old:</span>
                <span className={`font-mono text-sm ${oldValue !== newValue ? 'bg-red-100' : ''}`}>
                    {oldStr}
                </span>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-green-600">New:</span>
                <span
                    className={`font-mono text-sm ${oldValue !== newValue ? 'bg-green-100' : ''}`}
                >
                    {newStr}
                </span>
            </div>
        </div>
    );
}
