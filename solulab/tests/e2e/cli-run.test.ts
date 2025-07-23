import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { runCLI, createTestEnv, setupFixtures } from './helpers';

// Note: These tests require 'solulab' package to be built and linked
// Run 'bun link' in the solulab directory before running tests

describe('solulab CLI commands', () => {
    describe('run command', () => {
        let testDir: string;
        let cleanup: () => void;

        beforeEach(async () => {
            const env = await createTestEnv();
            testDir = env.dir;
            cleanup = env.cleanup;
        });

        afterEach(() => {
            cleanup();
        });

        it('exits with 0 when all executions succeed', async () => {
            await setupFixtures(testDir, ['successful.lab.ts', 'solulab.config.js']);

            const result = await runCLI(testDir);

            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('All');
            expect(result.stdout).toContain('succeeded');
            expect(result.stdout).toContain('Successful Test Lab');
            expect(result.stdout).toContain('✅ All 4 executions succeeded');
        });

        it('exits with 1 when any execution fails', async () => {
            await setupFixtures(testDir, ['failing.lab.ts', 'solulab.config.js']);

            const result = await runCLI(testDir);

            expect(result.exitCode).toBe(1);
            expect(result.stdout).toContain('failed');
            expect(result.stdout).toContain('succeeded');
            expect(result.stdout).toContain('Intentional failure');

            // Verify specific failure messages appear
            expect(result.stdout).toContain('1 failed, 3 succeeded');
        });

        it.skip('skips already executed combinations', async () => {
            // FIXME: This test is skipped because the database module is hardcoded to use
            // .solulab/solulab.json relative to process.cwd(), not the test directory.
            // The database module needs to be refactored to accept a configurable path.

            await setupFixtures(testDir, ['successful.lab.ts', 'solulab.config.js']);

            // First run
            const firstRun = await runCLI(testDir);
            expect(firstRun.exitCode).toBe(0);
            expect(firstRun.stdout).not.toContain('Skipping');
            expect(firstRun.stdout).toContain('✅ All 4 executions succeeded');

            // Verify database was created
            const dbPath = path.join(testDir, '.solulab', 'solulab.json');
            const dbExists = await fs
                .access(dbPath)
                .then(() => true)
                .catch(() => false);
            expect(dbExists).toBe(true);

            // Second run - should skip all
            const secondRun = await runCLI(testDir);
            expect(secondRun.exitCode).toBe(0);
            expect(secondRun.stdout).toContain('Skipping');
            expect(secondRun.stdout).toContain('already exists');
            expect(secondRun.stdout).toContain('No new executions needed');
        });

        it('discovers labs using config glob patterns', async () => {
            // Create a different config that looks for .test.lab.ts files
            const customConfig = `module.exports = {
            dbPath: '.solulab/test.db',
            labGlobs: ['*.test.lab.ts'],
        };`;

            await fs.writeFile(path.join(testDir, 'solulab.config.js'), customConfig);

            // Copy lab with different extension
            const labContent = await fs.readFile(
                path.join(__dirname, 'fixtures/successful.lab.ts'),
                'utf-8'
            );
            await fs.writeFile(path.join(testDir, 'test.test.lab.ts'), labContent);

            // Also copy a lab that shouldn't be discovered
            await fs.writeFile(path.join(testDir, 'ignored.lab.ts'), labContent);

            const result = await runCLI(testDir);

            expect(result.stdout).toContain('Found 1 labs');
            expect(result.stdout).toContain('Successful Test Lab');
        });

        it('uses custom glob patterns from config', async () => {
            const customConfig = `module.exports = {
            labGlobs: ['*.success.lab.ts'],
        };`;

            await fs.writeFile(path.join(testDir, 'solulab.config.js'), customConfig);

            // Copy lab with custom extension
            const labContent = await fs.readFile(
                path.join(
                    path.dirname(new URL(import.meta.url).pathname),
                    'fixtures/successful.lab.ts'
                ),
                'utf-8'
            );
            await fs.writeFile(path.join(testDir, 'test.success.lab.ts'), labContent);
            await fs.writeFile(path.join(testDir, 'ignored.lab.ts'), labContent);

            const result = await runCLI(testDir);

            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Found 1 labs');
        });

        it('handles labs that throw errors', async () => {
            await setupFixtures(testDir, ['error.lab.ts', 'solulab.config.js']);

            const result = await runCLI(testDir);

            expect(result.exitCode).toBe(1);
            expect(result.stdout).toContain('failed');
            expect(result.stdout).toContain('Synchronous error');
            expect(result.stdout).toContain('Asynchronous error');
        });

        it('shows correct summary statistics', async () => {
            await setupFixtures(testDir, [
                'successful.lab.ts',
                'failing.lab.ts',
                'solulab.config.js',
            ]);

            const result = await runCLI(testDir);

            // Should show totals
            expect(result.stdout).toContain('Total combinations: 8'); // 4 + 4
            expect(result.stdout).toContain('Executed: 8');

            // Should show final counts
            expect(result.stdout).toMatch(/\d+ failed, \d+ succeeded/);
        });

        it('handles missing lab exports gracefully', async () => {
            // Create a lab file without proper export
            const invalidLab = `import { createSolutionLab } from 'solulab';
import { z } from 'zod';

// Missing lab__ prefix in export
export const invalidLab = createSolutionLab({
    name: 'Invalid Lab',
    description: 'No export',
    paramSchema: z.object({}),
    resultSchema: z.object({}),
    versions: [{
        name: 'test',
        execute() { return {}; }
    }],
    cases: [{
        name: 'test',
        arguments: {}
    }],
});`;

            await fs.writeFile(path.join(testDir, 'invalid.lab.ts'), invalidLab);
            await setupFixtures(testDir, ['solulab.config.js']);

            const result = await runCLI(testDir);

            // The lab won't be discovered since it doesn't have lab__ prefix
            // So we expect "No labs found"
            expect(result.stdout).toContain('No labs found');
        });

        it('handles no labs found scenario', async () => {
            // Config that won't find any labs
            const emptyConfig = `module.exports = {
            dbPath: '.solulab/test.db',
            labGlobs: ['**/*.notfound.ts'],
        };`;

            await fs.writeFile(path.join(testDir, 'solulab.config.js'), emptyConfig);

            const result = await runCLI(testDir);

            expect(result.stdout).toContain('No labs found');
            expect(result.exitCode).toBe(0); // Should still exit cleanly
        });
    });

    describe('reset command', () => {
        let testDir: string;
        let cleanup: () => void;

        beforeEach(async () => {
            const env = await createTestEnv();
            testDir = env.dir;
            cleanup = env.cleanup;
        });

        afterEach(() => {
            cleanup();
        });

        it('removes the .solulab directory when it exists', async () => {
            // Create .solulab directory with a database file
            const dbDir = path.join(testDir, '.solulab');
            await fs.mkdir(dbDir, { recursive: true });
            await fs.writeFile(path.join(dbDir, 'solulab.json'), '{"labs":[],"labResults":[]}');

            // Run reset command
            const result = await runCLI(testDir, ['reset']);

            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('🧹 Resetting Solulab...');
            expect(result.stdout).toContain('✓ Removed .solulab directory');
            expect(result.stdout).toContain('✨ Reset complete!');

            // Verify directory was removed
            const dirExists = await fs
                .access(dbDir)
                .then(() => true)
                .catch(() => false);
            expect(dirExists).toBe(false);
        });

        it('handles gracefully when .solulab directory does not exist', async () => {
            // Run reset command without creating .solulab directory
            const result = await runCLI(testDir, ['reset']);

            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('🧹 Resetting Solulab...');
            expect(result.stdout).toContain('✓ No .solulab directory found');
            expect(result.stdout).toContain('✨ Reset complete!');
        });
    });
});
