// API layer - fetches real database in development mode
import type { PersistentLab, PersistentLabResult } from '@/core/types';

interface DatabaseSchema {
    labs: PersistentLab[];
    labResults: PersistentLabResult[];
}

let cachedDatabase: DatabaseSchema | null = null;

async function fetchDatabase(): Promise<DatabaseSchema> {
    if (cachedDatabase) {
        return cachedDatabase;
    }

    try {
        const response = await fetch('/api/database');

        if (response.ok) {
            const data = await response.json();
            cachedDatabase = data;

            // Log in development mode
            if (import.meta.env.DEV) {
                console.log('[Solulab API] Database loaded successfully');
            }

            return data;
        }
    } catch (error) {
        console.error('Failed to fetch database:', error);
    }

    throw new Error('Failed to load database. Make sure to run "solulab run" first.');
}

export async function getLabs(): Promise<PersistentLab[]> {
    const db = await fetchDatabase();

    return db.labs;
}

export async function getLabResults(labId?: number): Promise<PersistentLabResult[]> {
    const db = await fetchDatabase();
    let results = db.labResults;

    if (labId !== undefined) {
        results = results.filter((r) => r.labId === labId);
    }

    return results;
}

export async function getLatestResults(): Promise<(PersistentLabResult & { labName: string })[]> {
    const db = await fetchDatabase();
    const labs = db.labs;

    // Join lab names with results
    const resultsWithNames = db.labResults.map((result) => {
        const lab = labs.find((l) => l.id === result.labId);

        return {
            ...result,
            labName: lab?.name || 'Unknown Lab',
        };
    });

    // Group by labId and get the latest result for each
    const latestByLab = new Map<number, (typeof resultsWithNames)[0]>();

    for (const result of resultsWithNames) {
        const existing = latestByLab.get(result.labId);

        if (!existing || new Date(result.timestamp) > new Date(existing.timestamp)) {
            latestByLab.set(result.labId, result);
        }
    }

    return Array.from(latestByLab.values());
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
