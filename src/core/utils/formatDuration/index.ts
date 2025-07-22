export function formatDuration(ms: number): string {
    if (ms < 1000) {
        return `${ms}ms`;
    }

    return `${(ms / 1000).toFixed(2)}s`;
}
