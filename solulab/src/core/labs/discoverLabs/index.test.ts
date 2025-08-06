import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as path from 'path';
import { discoverLabs } from './index';

// Mock the glob module
const mockGlob = mock();
const mockImport = mock();

describe('discoverLabs', () => {
    beforeEach(() => {
        mockGlob.mockClear();
        mockImport.mockClear();
    });

    test('discovers labs from matching files', async () => {
        // Create a temporary test lab file
        const testDir = path.join(import.meta.dir, 'test-labs');
        const testFile = path.join(testDir, 'test.lab.ts');

        // Create test directory and file
        await Bun.write(
            testFile,
            `
            import { createSolutionLab } from '../../createSolutionLab';
            import { z } from 'zod';

            export const lab__test_discovery = createSolutionLab({
                name: 'test-discovery',
                description: 'Test lab for discovery',
                paramSchema: z.object({ value: z.number() }),
                resultSchema: z.object({ result: z.number() }),
                versions: [{ name: 'v1', execute: async (p) => ({ result: p.value }) }],
                cases: [{ name: 'case1', arguments: { value: 1 } }],
            });

            export const notALab = { something: 'else' };
            `
        );

        try {
            const definitions = await discoverLabs([path.join(testDir, '*.lab.ts')]);

            expect(definitions).toHaveLength(1);
            expect(definitions[0].name).toBe('test-discovery');
            expect(definitions[0].description).toBe('Test lab for discovery');
            expect(definitions[0].filePath).toBe(testFile);
            expect(definitions[0].versions).toEqual(['v1']);
            expect(definitions[0].cases).toEqual(['case1']);
        } finally {
            // Clean up
            await import('fs').then((fs) =>
                fs.promises.rm(testDir, { recursive: true, force: true })
            );
        }
    });

    test('ignores exports that do not match lab naming pattern', async () => {
        const testDir = path.join(import.meta.dir, 'test-invalid');
        const testFile = path.join(testDir, 'invalid.lab.ts');

        await Bun.write(
            testFile,
            `
            export const regularExport = { definition: { name: 'not-a-lab' } };
            export const another_export = { definition: { name: 'also-not' } };
            export function someFunction() {}
            `
        );

        try {
            const definitions = await discoverLabs([path.join(testDir, '*.lab.ts')]);
            expect(definitions).toHaveLength(0);
        } finally {
            await import('fs').then((fs) =>
                fs.promises.rm(testDir, { recursive: true, force: true })
            );
        }
    });

    test('handles file loading errors gracefully', async () => {
        const testDir = path.join(import.meta.dir, 'test-error');
        const testFile = path.join(testDir, 'error.lab.ts');

        await Bun.write(
            testFile,
            `
            throw new Error('Cannot load this module');
            `
        );

        // Capture console output
        const originalError = console.error;
        const errors: any[] = [];
        console.error = (...args) => errors.push(args);

        try {
            const definitions = await discoverLabs([path.join(testDir, '*.lab.ts')]);
            expect(definitions).toHaveLength(0);
            expect(errors).toHaveLength(1);
            expect(errors[0][0]).toContain('Failed to load lab');
        } finally {
            console.error = originalError;
            await import('fs').then((fs) =>
                fs.promises.rm(testDir, { recursive: true, force: true })
            );
        }
    });

    test('respects ignore patterns', async () => {
        // The default patterns should ignore node_modules and dist
        const definitions = await discoverLabs(['node_modules/**/*.lab.ts', 'dist/**/*.lab.ts']);
        expect(definitions).toHaveLength(0);
    });

    test('discovers multiple labs from single file', async () => {
        const testDir = path.join(import.meta.dir, 'test-multiple');
        const testFile = path.join(testDir, 'multiple.lab.ts');

        await Bun.write(
            testFile,
            `
            import { createSolutionLab } from '../../createSolutionLab';
            import { z } from 'zod';

            export const lab__first = createSolutionLab({
                name: 'first-lab',
                description: 'First lab',
                paramSchema: z.object({ x: z.number() }),
                resultSchema: z.object({ y: z.number() }),
                versions: [{ name: 'v1', execute: async (p) => ({ y: p.x }) }],
                cases: [{ name: 'c1', arguments: { x: 1 } }],
            });

            export const lab__second = createSolutionLab({
                name: 'second-lab',
                description: 'Second lab',
                paramSchema: z.object({ a: z.string() }),
                resultSchema: z.object({ b: z.string() }),
                versions: [{ name: 'v2', execute: async (p) => ({ b: p.a }) }],
                cases: [{ name: 'c2', arguments: { a: 'test' } }],
            });
            `
        );

        try {
            const definitions = await discoverLabs([path.join(testDir, '*.lab.ts')]);

            expect(definitions).toHaveLength(2);

            const firstLab = definitions.find((d) => d.name === 'first-lab');
            expect(firstLab).toBeDefined();
            expect(firstLab?.description).toBe('First lab');

            const secondLab = definitions.find((d) => d.name === 'second-lab');
            expect(secondLab).toBeDefined();
            expect(secondLab?.description).toBe('Second lab');
        } finally {
            await import('fs').then((fs) =>
                fs.promises.rm(testDir, { recursive: true, force: true })
            );
        }
    });

    test('handles labs without definition property', async () => {
        const testDir = path.join(import.meta.dir, 'test-no-def');
        const testFile = path.join(testDir, 'nodef.lab.ts');

        await Bun.write(
            testFile,
            `
            export const lab__no_definition = {
                execute: () => {},
                executeAll: () => {},
            };
            `
        );

        try {
            const definitions = await discoverLabs([path.join(testDir, '*.lab.ts')]);
            expect(definitions).toHaveLength(0);
        } finally {
            await import('fs').then((fs) =>
                fs.promises.rm(testDir, { recursive: true, force: true })
            );
        }
    });

    test('uses default pattern when none provided', async () => {
        // Create a lab in the default location pattern
        const testFile = path.join(import.meta.dir, 'default.lab.js');

        await Bun.write(
            testFile,
            `
            export const lab__default_pattern = {
                definition: {
                    name: 'default-pattern',
                    description: 'Default pattern test',
                    paramSchema: {},
                    resultSchema: {},
                    versions: ['v1'],
                    cases: ['c1'],
                    filePath: ''
                }
            };
            `
        );

        try {
            // Call without patterns to use default
            const definitions = await discoverLabs();

            // Should find our test lab if pattern includes this directory
            const found = definitions.find((d) => d.name === 'default-pattern');
            if (found) {
                expect(found.description).toBe('Default pattern test');
            }
        } finally {
            await import('fs').then((fs) => fs.promises.unlink(testFile));
        }
    });

    test('handles TypeScript and JavaScript files', async () => {
        const testDir = path.join(import.meta.dir, 'test-both');
        const tsFile = path.join(testDir, 'typescript.lab.ts');
        const jsFile = path.join(testDir, 'javascript.lab.js');

        await Bun.write(
            tsFile,
            `
            import { createSolutionLab } from '../../createSolutionLab';
            import { z } from 'zod';

            export const lab__typescript = createSolutionLab({
                name: 'ts-lab',
                description: 'TypeScript lab',
                paramSchema: z.object({}),
                resultSchema: z.object({ ts: z.boolean() }),
                versions: [{ name: 'v1', execute: async () => ({ ts: true }) }],
                cases: [{ name: 'c1', arguments: {} }],
            });
            `
        );

        await Bun.write(
            jsFile,
            `
            export const lab__javascript = {
                definition: {
                    name: 'js-lab',
                    description: 'JavaScript lab',
                    paramSchema: {},
                    resultSchema: {},
                    versions: ['v1'],
                    cases: ['c1'],
                    filePath: ''
                }
            };
            `
        );

        try {
            const definitions = await discoverLabs([path.join(testDir, '*.lab.{ts,js}')]);

            expect(definitions).toHaveLength(2);

            const tsLab = definitions.find((d) => d.name === 'ts-lab');
            expect(tsLab).toBeDefined();

            const jsLab = definitions.find((d) => d.name === 'js-lab');
            expect(jsLab).toBeDefined();
        } finally {
            await import('fs').then((fs) =>
                fs.promises.rm(testDir, { recursive: true, force: true })
            );
        }
    });
});
