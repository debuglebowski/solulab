import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export async function createTestEnv(): Promise<{ dir: string; cleanup: () => void }> {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'solulab-test-'));

    // Create symlinks to necessary modules
    const nodeModulesDir = path.join(dir, 'node_modules');
    await fsPromises.mkdir(nodeModulesDir, { recursive: true });

    // Link solulab module to project root (contains package.json with proper exports)
    const solulabLink = path.join(nodeModulesDir, 'solulab');
    await fsPromises.symlink(process.cwd(), solulabLink, 'dir');

    // Link zod module
    const zodLink = path.join(nodeModulesDir, 'zod');
    await fsPromises.symlink(path.join(process.cwd(), 'node_modules/zod'), zodLink, 'dir');

    const cleanup = () => {
        try {
            fs.rmSync(dir, { recursive: true, force: true });
        } catch (error) {
            console.error('Failed to cleanup test directory:', error);
        }
    };

    return { dir, cleanup };
}
