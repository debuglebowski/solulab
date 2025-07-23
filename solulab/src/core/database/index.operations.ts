import type { LabResult, PersistentLab, PersistentLabResult } from '../types';
import { ensureInitialized, getNextId } from './index.init';

// Lab operations
export async function getLabs(): Promise<PersistentLab[]> {
    const db = await ensureInitialized();

    return [...db.data.labs].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getLabByName(name: string): Promise<PersistentLab | undefined> {
    const db = await ensureInitialized();

    return db.data.labs.find((lab) => lab.name === name);
}

export async function getOrCreateLab(
    name: string,
    description: string,
    paramSchema: unknown,
    resultSchema: unknown
): Promise<number> {
    const db = await ensureInitialized();

    const existing = db.data.labs.find((lab) => lab.name === name);

    if (existing) {
        return existing.id;
    }

    const id = getNextId(db.data.labs);
    const newLab: PersistentLab = {
        id,
        name,
        description,
        paramSchema: JSON.stringify(paramSchema),
        resultSchema: JSON.stringify(resultSchema),
    };

    db.data.labs.push(newLab);
    await db.write();

    return id;
}

// Lab result operations
export async function getLabResults(labId?: number): Promise<PersistentLabResult[]> {
    const db = await ensureInitialized();

    let results = db.data.labResults;

    if (labId !== undefined) {
        results = results.filter((result) => result.labId === labId);
    }

    return [...results].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

export async function getLatestResults(): Promise<(PersistentLabResult & { labName: string })[]> {
    const db = await ensureInitialized();

    return db.data.labResults
        .map((result) => {
            const lab = db.data.labs.find((l) => l.id === result.labId);

            return {
                ...result,
                labName: lab?.name || 'Unknown',
            };
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function hasResult(
    labId: number,
    versionName: string,
    caseName: string
): Promise<boolean> {
    const db = await ensureInitialized();

    return db.data.labResults.some(
        (result) =>
            result.labId === labId &&
            result.versionName === versionName &&
            result.caseName === caseName
    );
}

export async function saveResult<TParams, TResult>(
    labId: number,
    labResult: LabResult<TParams, TResult>
): Promise<void> {
    const db = await ensureInitialized();

    // Skip if result already exists
    if (await hasResult(labId, labResult.versionName, labResult.caseName)) {
        return;
    }

    const id = getNextId(db.data.labResults);
    const newResult: PersistentLabResult = {
        id,
        labId,
        versionName: labResult.versionName,
        caseName: labResult.caseName,
        params: JSON.stringify(labResult.params),
        result: JSON.stringify(labResult.result),
        timestamp: labResult.timestamp,
        duration: labResult.duration,
        error: labResult.error || null,
    };

    db.data.labResults.push(newResult);
    await db.write();
}

// Utility methods
export async function getResultMatrix(labId: number): Promise<{
    versions: string[];
    cases: string[];
    results: Map<string, PersistentLabResult>;
}> {
    const db = await ensureInitialized();

    const results = db.data.labResults
        .filter((result) => result.labId === labId)
        .sort((a, b) => {
            const versionCompare = a.versionName.localeCompare(b.versionName);

            return versionCompare !== 0 ? versionCompare : a.caseName.localeCompare(b.caseName);
        });

    const versions = new Set<string>();
    const cases = new Set<string>();
    const resultMap = new Map<string, PersistentLabResult>();

    for (const result of results) {
        versions.add(result.versionName);
        cases.add(result.caseName);
        resultMap.set(`${result.versionName}:${result.caseName}`, result);
    }

    return {
        versions: Array.from(versions),
        cases: Array.from(cases),
        results: resultMap,
    };
}

export function close() {
    // No-op for JSON database - LowDB handles cleanup automatically
}
