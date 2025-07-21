export function formatDuration(ms: number): string {
    if (ms < 1000) {
        return `${ms}ms`;
    }

    return `${(ms / 1000).toFixed(2)}s`;
}

export function formatValue(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number') {
        return value.toString();
    }
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }

    return JSON.stringify(value, null, 2);
}

export function isLongText(value: unknown): boolean {
    if (typeof value !== 'string') {
        return false;
    }

    return value.length > 100 || value.includes('\n');
}
