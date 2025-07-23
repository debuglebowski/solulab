import fsPromises from 'node:fs/promises';

export async function getDatabaseStats(dbPath: string): Promise<{
    labCount: number;
    resultCount: number;
}> {
    try {
        const dbContent = await fsPromises.readFile(dbPath, 'utf-8');
        const data = JSON.parse(dbContent);

        const labCount = data.labs?.length || 0;
        const resultCount = data.labResults?.length || 0;

        return { labCount, resultCount };
    } catch (_error) {
        // Database file might not exist yet
        return { labCount: 0, resultCount: 0 };
    }
}
