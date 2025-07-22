export function isLongText(value: unknown): boolean {
    if (typeof value !== 'string') {
        return false;
    }

    return value.length > 100 || value.includes('\n');
}
