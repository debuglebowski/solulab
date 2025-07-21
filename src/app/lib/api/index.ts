// Mock API for demo purposes - in production this would connect to a backend service
import type { PersistentLab, PersistentLabResult } from '@/core/types';

const mockLabs: PersistentLab[] = [
    {
        id: 1,
        name: 'CPU Usage',
        description: 'Measures CPU usage',
        paramSchema: '{}',
        resultSchema: '{}',
    },
    {
        id: 2,
        name: 'Memory Usage',
        description: 'Monitors memory',
        paramSchema: '{}',
        resultSchema: '{}',
    },
];

// Mock data for demo
const mockResults: (PersistentLabResult & { labName: string })[] = [
    {
        id: 1,
        labId: 1,
        labName: 'CPU Usage',
        versionName: 'naive average',
        caseName: 'medium sample',
        params: JSON.stringify({ sampleMs: 500 }),
        result: JSON.stringify(0.15),
        timestamp: new Date().toISOString(),
        duration: 502,
        error: null,
    },
    {
        id: 2,
        labId: 2,
        labName: 'Memory Usage',
        versionName: 'basic calculation',
        caseName: 'default',
        params: JSON.stringify({ includeBuffers: false }),
        result: JSON.stringify({
            totalMB: 16384,
            freeMB: 4096,
            usedMB: 12288,
            usagePercent: 75,
        }),
        timestamp: new Date().toISOString(),
        duration: 15,
        error: null,
    },
];

export async function getLabs(): Promise<PersistentLab[]> {
    return mockLabs;
}

export async function getLabResults(labId?: number): Promise<PersistentLabResult[]> {
    let results = mockResults;

    if (labId !== undefined) {
        results = results.filter((r) => r.labId === labId);
    }

    return results;
}

export async function getLatestResults(): Promise<(PersistentLabResult & { labName: string })[]> {
    return mockResults;
}
