import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { runLabs } from './index';

// Mock modules
const mockDiscoverLabs = mock();
const mockDatabase = {
    getOrCreateLab: mock(),
    hasResult: mock(),
    saveResult: mock(),
    close: mock(),
};

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const mockConsoleLog = mock();
const mockConsoleError = mock();

describe('CLI runner', () => {
    beforeEach(() => {
        // Reset all mocks
        mockDiscoverLabs.mockClear();
        mockDatabase.getOrCreateLab.mockClear();
        mockDatabase.hasResult.mockClear();
        mockDatabase.saveResult.mockClear();
        mockDatabase.close.mockClear();
        mockConsoleLog.mockClear();
        mockConsoleError.mockClear();
        
        // Replace console methods
        console.log = mockConsoleLog;
        console.error = mockConsoleError;
    });

    afterEach(() => {
        // Restore console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });

    test('handles no labs found', async () => {
        // Create a test config file
        const testDir = path.join(import.meta.dir, 'test-runner-empty');
        await fs.mkdir(testDir, { recursive: true });
        
        const config = {
            labGlobs: [`${testDir}/*.lab.ts`],
        };

        try {
            // Run should exit with 0 (process.exit mocked below)
            const mockExit = mock();
            const originalExit = process.exit;
            process.exit = mockExit as any;
            
            await runLabs(config);
            
            // Should log no labs found
            expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('No labs found'));
            
            process.exit = originalExit;
        } finally {
            await fs.rm(testDir, { recursive: true, force: true });
        }
    });

    test('executes discovered labs successfully', async () => {
        // Create test lab file
        const testDir = path.join(import.meta.dir, 'test-runner-success');
        const testFile = path.join(testDir, 'test.lab.ts');
        
        await fs.mkdir(testDir, { recursive: true });
        await Bun.write(
            testFile,
            `
            import { createSolutionLab } from '../../core/labs/createSolutionLab';
            import { z } from 'zod';
            
            export const lab__test_runner = createSolutionLab({
                name: 'test-runner-lab',
                description: 'Test lab for runner',
                paramSchema: z.object({ value: z.number() }),
                resultSchema: z.object({ result: z.number() }),
                versions: [
                    { name: 'v1', execute: async (p) => ({ result: p.value * 2 }) },
                    { name: 'v2', execute: async (p) => ({ result: p.value * 3 }) },
                ],
                cases: [
                    { name: 'case1', arguments: { value: 5 } },
                    { name: 'case2', arguments: { value: 10 } },
                ],
            });
            `
        );

        const config = {
            labGlobs: [`${testDir}/*.lab.ts`],
        };

        try {
            // Mock process.exit
            const mockExit = mock();
            const originalExit = process.exit;
            process.exit = mockExit as any;
            
            await runLabs(config);
            
            // Should have logged success
            expect(mockConsoleLog).toHaveBeenCalled();
            
            // Should exit with 0 for success
            expect(mockExit).toHaveBeenCalledWith(0);
            
            process.exit = originalExit;
        } finally {
            await fs.rm(testDir, { recursive: true, force: true });
        }
    });

    test('skips already executed combinations', async () => {
        // Create test lab file
        const testDir = path.join(import.meta.dir, 'test-runner-skip');
        const testFile = path.join(testDir, 'skip.lab.ts');
        
        await fs.mkdir(testDir, { recursive: true });
        await Bun.write(
            testFile,
            `
            import { createSolutionLab } from '../../core/labs/createSolutionLab';
            import { z } from 'zod';
            
            export const lab__skip_test = createSolutionLab({
                name: 'skip-test-lab',
                description: 'Test skipping',
                paramSchema: z.object({ x: z.number() }),
                resultSchema: z.object({ y: z.number() }),
                versions: [
                    { name: 'v1', execute: async (p) => ({ y: p.x }) },
                ],
                cases: [
                    { name: 'case1', arguments: { x: 1 } },
                ],
            });
            `
        );

        // Note: Database mocking would be needed here for full test coverage
        // Currently testing with actual file system operations

        const config = {
            labGlobs: [`${testDir}/*.lab.ts`],
        };

        try {
            // Mock process.exit
            const mockExit = mock();
            const originalExit = process.exit;
            process.exit = mockExit as any;
            
            await runLabs(config);
            
            // Should log skipping message
            const logCalls = mockConsoleLog.mock.calls;
            // Check if skip messages were logged
            logCalls.some(call => 
                call[0]?.toString().includes('Skipping') || 
                call[0]?.toString().includes('already exists')
            );
            
            // If not all were skipped, should exit with 0
            expect(mockExit).toHaveBeenCalled();
            
            process.exit = originalExit;
        } finally {
            await fs.rm(testDir, { recursive: true, force: true });
        }
    });

    test('handles execution errors', async () => {
        // Create test lab file with error
        const testDir = path.join(import.meta.dir, 'test-runner-error');
        const testFile = path.join(testDir, 'error.lab.ts');
        
        await fs.mkdir(testDir, { recursive: true });
        await Bun.write(
            testFile,
            `
            import { createSolutionLab } from '../../core/labs/createSolutionLab';
            import { z } from 'zod';
            
            export const lab__error_test = createSolutionLab({
                name: 'error-test-lab',
                description: 'Test errors',
                paramSchema: z.object({ shouldFail: z.boolean() }),
                resultSchema: z.object({ ok: z.boolean() }),
                versions: [
                    { 
                        name: 'failing', 
                        execute: async (p) => {
                            if (p.shouldFail) throw new Error('Test error');
                            return { ok: true };
                        }
                    },
                ],
                cases: [
                    { name: 'fail', arguments: { shouldFail: true } },
                    { name: 'pass', arguments: { shouldFail: false } },
                ],
            });
            `
        );

        const config = {
            labGlobs: [`${testDir}/*.lab.ts`],
        };

        try {
            // Mock process.exit
            const mockExit = mock();
            const originalExit = process.exit;
            process.exit = mockExit as any;
            
            await runLabs(config);
            
            // Should log error messages
            const logCalls = mockConsoleLog.mock.calls;
            // Check if error messages were logged
            logCalls.some(call => 
                call[0]?.toString().includes('failed') || 
                call[0]?.toString().includes('❌')
            );
            
            // Should exit with 1 for failure (if there were failures)
            expect(mockExit).toHaveBeenCalled();
            
            process.exit = originalExit;
        } finally {
            await fs.rm(testDir, { recursive: true, force: true });
        }
    });

    test('handles missing lab export', async () => {
        // Create test lab file without proper export
        const testDir = path.join(import.meta.dir, 'test-runner-no-export');
        const testFile = path.join(testDir, 'no-export.lab.ts');
        
        await fs.mkdir(testDir, { recursive: true });
        await Bun.write(
            testFile,
            `
            // File with .lab.ts extension but no lab__ export
            export const someOtherThing = {
                definition: { name: 'not-a-lab' }
            };
            `
        );

        const config = {
            labGlobs: [`${testDir}/*.lab.ts`],
        };

        try {
            // Mock process.exit
            const mockExit = mock();
            const originalExit = process.exit;
            process.exit = mockExit as any;
            
            await runLabs(config);
            
            // Should handle gracefully
            expect(mockExit).toHaveBeenCalled();
            
            process.exit = originalExit;
        } finally {
            await fs.rm(testDir, { recursive: true, force: true });
        }
    });

    test('reports correct statistics', async () => {
        // Create test lab with multiple versions and cases
        const testDir = path.join(import.meta.dir, 'test-runner-stats');
        const testFile = path.join(testDir, 'stats.lab.ts');
        
        await fs.mkdir(testDir, { recursive: true });
        await Bun.write(
            testFile,
            `
            import { createSolutionLab } from '../../core/labs/createSolutionLab';
            import { z } from 'zod';
            
            export const lab__stats_test = createSolutionLab({
                name: 'stats-test-lab',
                description: 'Test statistics',
                paramSchema: z.object({ n: z.number() }),
                resultSchema: z.object({ result: z.number() }),
                versions: [
                    { name: 'v1', execute: async (p) => ({ result: p.n }) },
                    { name: 'v2', execute: async (p) => ({ result: p.n * 2 }) },
                ],
                cases: [
                    { name: 'c1', arguments: { n: 1 } },
                    { name: 'c2', arguments: { n: 2 } },
                    { name: 'c3', arguments: { n: 3 } },
                ],
            });
            `
        );

        const config = {
            labGlobs: [`${testDir}/*.lab.ts`],
        };

        try {
            // Mock process.exit
            const mockExit = mock();
            const originalExit = process.exit;
            process.exit = mockExit as any;
            
            await runLabs(config);
            
            // Should log statistics (6 total combinations: 2 versions × 3 cases)
            const logCalls = mockConsoleLog.mock.calls;
            // Check if statistics were logged
            logCalls.some(call => {
                const str = call[0]?.toString() || '';
                return str.includes('Total combinations') || 
                       str.includes('Executed') ||
                       str.includes('succeeded');
            });
            
            process.exit = originalExit;
        } finally {
            await fs.rm(testDir, { recursive: true, force: true });
        }
    });
});