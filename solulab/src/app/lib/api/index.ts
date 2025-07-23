// API layer - uses real database in development, mock data in production
import type { PersistentLab, PersistentLabResult } from '@/core/types';
import { database } from '@/core/database';

// Check if we're in development mode and should use real database
const USE_REAL_DB = import.meta.env.DEV;

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
    if (USE_REAL_DB) {
        try {
            return await database.getLabs();
        } catch (error) {
            console.warn('Failed to load from database, falling back to mock data:', error);
        }
    }

    return mockLabs;
}

export async function getLabResults(labId?: number): Promise<PersistentLabResult[]> {
    if (USE_REAL_DB) {
        try {
            return await database.getLabResults(labId);
        } catch (error) {
            console.warn('Failed to load from database, falling back to mock data:', error);
        }
    }

    let results = mockResults;

    if (labId !== undefined) {
        results = results.filter((r) => r.labId === labId);
    }

    return results;
}

export async function getLatestResults(): Promise<(PersistentLabResult & { labName: string })[]> {
    if (USE_REAL_DB) {
        try {
            return await database.getLatestResults();
        } catch (error) {
            console.warn('Failed to load from database, falling back to mock data:', error);
        }
    }

    return mockResults;
}

export async function getLabByName(name: string): Promise<PersistentLab | null> {
    const labs = await getLabs();

    return labs.find((lab) => lab.name === name) || null;
}

export async function getResultsByLabAndCase(
    labId: number,
    caseName: string
): Promise<PersistentLabResult[]> {
    const results = await getLabResults(labId);

    return results.filter((r) => r.caseName === caseName);
}

export async function getResultProperties(labId: number): Promise<string[]> {
    const results = await getLabResults(labId);

    if (results.length === 0) {
        return [];
    }

    try {
        // Parse the first result to extract property keys
        const firstResult = JSON.parse(results[0].result);

        if (
            typeof firstResult === 'object' &&
            firstResult !== null &&
            !Array.isArray(firstResult)
        ) {
            return Object.keys(firstResult).sort();
        }
    } catch {
        // Not an object result
    }

    return [];
}
