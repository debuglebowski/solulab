import fsPromises from 'node:fs/promises';
import path from 'node:path';

export async function setupFixtures(dir: string, files: string[]): Promise<void> {
    const fixturesDir = path.join(
        path.dirname(new URL(import.meta.url).pathname),
        '../../fixtures'
    );

    for (const file of files) {
        const source = path.join(fixturesDir, file);
        const dest = path.join(dir, file);

        await fsPromises.mkdir(path.dirname(dest), { recursive: true });
        await fsPromises.copyFile(source, dest);
    }
}
