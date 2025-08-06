import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

// Mock modules before importing the module under test
const mockDiscoverLabs = mock();
const mockDatabase = {
    getOrCreateLab: mock(),
    hasResult: mock(),
    saveResult: mock(),
    close: mock(),
};

mock.module('@/core', () => ({
    discoverLabs: mockDiscoverLabs,
    database: mockDatabase,
}));

import { runLabs } from './index';

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
        mockDiscoverLabs.mockResolvedValue([]);

        const config = {
            labGlobs: ['**/*.lab.ts'],
        };

        await runLabs(config);

        // Should log no labs found
        const logCalls = mockConsoleLog.mock.calls;
        const foundNoLabs = logCalls.some((call) => call[0]?.toString().includes('No labs found'));
        expect(foundNoLabs).toBe(true);

        // Should close database
        expect(mockDatabase.close).toHaveBeenCalled();
    });

    test('executes discovered labs successfully', async () => {
        mockDiscoverLabs.mockResolvedValue([
            {
                name: 'test-runner-lab',
                description: 'Test lab for runner',
                filePath: '/fake/path/test.lab.ts',
                paramSchema: { type: 'object' },
                resultSchema: { type: 'object' },
                versions: ['v1', 'v2'],
                cases: ['case1', 'case2'],
            },
        ]);

        mockDatabase.getOrCreateLab.mockResolvedValue('lab-123');
        mockDatabase.hasResult.mockResolvedValue(false);
        mockDatabase.saveResult.mockResolvedValue(undefined);

        // Mock the dynamic import
        const mockLab = {
            execute: mock().mockResolvedValue({
                versionName: 'v1',
                caseName: 'case1',
                result: { result: 10 },
                duration: 5,
                error: null,
            }),
        };

        // Mock dynamic import
        const originalImport = global.import;
        global.import = mock().mockResolvedValue({
            lab__test_runner: mockLab,
        }) as any;

        const config = {
            labGlobs: ['**/*.lab.ts'],
        };

        // Mock process.exit
        const mockExit = mock();
        const originalExit = process.exit;
        process.exit = mockExit as any;

        await runLabs(config);

        // Should have logged success
        expect(mockConsoleLog).toHaveBeenCalled();

        // Should exit with 0 for success
        expect(mockExit).toHaveBeenCalledWith(0);

        // Restore
        process.exit = originalExit;
        global.import = originalImport;
    });

    test('skips already executed combinations', async () => {
        mockDiscoverLabs.mockResolvedValue([
            {
                name: 'skip-test-lab',
                description: 'Test skipping',
                filePath: '/fake/path/skip.lab.ts',
                paramSchema: { type: 'object' },
                resultSchema: { type: 'object' },
                versions: ['v1'],
                cases: ['case1'],
            },
        ]);

        mockDatabase.getOrCreateLab.mockResolvedValue('lab-456');
        mockDatabase.hasResult.mockResolvedValue(true); // Already executed

        // Mock the dynamic import
        const mockLab = {
            execute: mock(), // Should not be called
        };

        const originalImport = global.import;
        global.import = mock().mockResolvedValue({
            lab__skip_test: mockLab,
        }) as any;

        const config = {
            labGlobs: ['**/*.lab.ts'],
        };

        // Mock process.exit
        const mockExit = mock();
        const originalExit = process.exit;
        process.exit = mockExit as any;

        await runLabs(config);

        // Should log skipping message
        const logCalls = mockConsoleLog.mock.calls;
        const foundSkip = logCalls.some(
            (call) =>
                call[0]?.toString().includes('Skipping') ||
                call[0]?.toString().includes('already exists')
        );
        expect(foundSkip).toBe(true);

        // Should not have executed the lab
        expect(mockLab.execute).not.toHaveBeenCalled();

        // Should exit with 0 (no new executions)
        expect(mockExit).toHaveBeenCalledWith(0);

        // Restore
        process.exit = originalExit;
        global.import = originalImport;
    });

    test('handles execution errors', async () => {
        mockDiscoverLabs.mockResolvedValue([
            {
                name: 'error-test-lab',
                description: 'Test errors',
                filePath: '/fake/path/error.lab.ts',
                paramSchema: { type: 'object' },
                resultSchema: { type: 'object' },
                versions: ['failing'],
                cases: ['fail', 'pass'],
            },
        ]);

        mockDatabase.getOrCreateLab.mockResolvedValue('lab-789');
        mockDatabase.hasResult.mockResolvedValue(false);

        // Mock the dynamic import with a lab that throws an error
        const mockLab = {
            execute: mock()
                .mockRejectedValueOnce(new Error('Test error')) // First call fails
                .mockResolvedValueOnce({
                    // Second call succeeds
                    versionName: 'failing',
                    caseName: 'pass',
                    result: { ok: true },
                    duration: 5,
                    error: null,
                }),
        };

        const originalImport = global.import;
        global.import = mock().mockResolvedValue({
            lab__error_test: mockLab,
        }) as any;

        const config = {
            labGlobs: ['**/*.lab.ts'],
        };

        // Mock process.exit
        const mockExit = mock();
        const originalExit = process.exit;
        process.exit = mockExit as any;

        await runLabs(config);

        // Should log error messages
        const logCalls = mockConsoleLog.mock.calls;
        const foundError = logCalls.some(
            (call) => call[0]?.toString().includes('threw') || call[0]?.toString().includes('❌')
        );
        expect(foundError).toBe(true);

        // Should exit with 1 for failure
        expect(mockExit).toHaveBeenCalledWith(1);

        // Restore
        process.exit = originalExit;
        global.import = originalImport;
    });

    test('handles missing lab export', async () => {
        mockDiscoverLabs.mockResolvedValue([
            {
                name: 'no-export-lab',
                description: 'Test missing export',
                filePath: '/fake/path/no-export.lab.ts',
                paramSchema: { type: 'object' },
                resultSchema: { type: 'object' },
                versions: ['v1'],
                cases: ['case1'],
            },
        ]);

        // Mock the dynamic import with no lab__ export
        const originalImport = global.import;
        global.import = mock().mockResolvedValue({
            someOtherThing: { definition: { name: 'not-a-lab' } },
            // No lab__ export
        }) as any;

        const config = {
            labGlobs: ['**/*.lab.ts'],
        };

        // Mock process.exit
        const mockExit = mock();
        const originalExit = process.exit;
        process.exit = mockExit as any;

        await runLabs(config);

        // Should log error about missing export
        const errorCalls = mockConsoleError.mock.calls;
        const foundError = errorCalls.some((call) =>
            call[0]?.toString().includes('No lab export found')
        );
        expect(foundError).toBe(true);

        // Should still exit normally (no executions)
        expect(mockExit).toHaveBeenCalledWith(0);

        // Restore
        process.exit = originalExit;
        global.import = originalImport;
    });

    test('reports correct statistics', async () => {
        mockDiscoverLabs.mockResolvedValue([
            {
                name: 'stats-test-lab',
                description: 'Test statistics',
                filePath: '/fake/path/stats.lab.ts',
                paramSchema: { type: 'object' },
                resultSchema: { type: 'object' },
                versions: ['v1', 'v2'],
                cases: ['c1', 'c2', 'c3'],
            },
        ]);

        mockDatabase.getOrCreateLab.mockResolvedValue('lab-stats');
        mockDatabase.hasResult
            .mockResolvedValueOnce(false) // v1 x c1 - new
            .mockResolvedValueOnce(true) // v1 x c2 - skip
            .mockResolvedValueOnce(false) // v1 x c3 - new
            .mockResolvedValueOnce(false) // v2 x c1 - new
            .mockResolvedValueOnce(true) // v2 x c2 - skip
            .mockResolvedValueOnce(false); // v2 x c3 - new

        // Mock the dynamic import
        const mockLab = {
            execute: mock().mockResolvedValue({
                versionName: 'v1',
                caseName: 'c1',
                result: { result: 1 },
                duration: 5,
                error: null,
            }),
        };

        const originalImport = global.import;
        global.import = mock().mockResolvedValue({
            lab__stats_test: mockLab,
        }) as any;

        const config = {
            labGlobs: ['**/*.lab.ts'],
        };

        // Mock process.exit
        const mockExit = mock();
        const originalExit = process.exit;
        process.exit = mockExit as any;

        await runLabs(config);

        // Should log statistics (6 total combinations: 2 versions × 3 cases)
        const logCalls = mockConsoleLog.mock.calls;
        const foundStats = logCalls.some((call) => {
            const str = call[0]?.toString() || '';
            return (
                str.includes('Total combinations') ||
                str.includes('Executed') ||
                str.includes('succeeded')
            );
        });
        expect(foundStats).toBe(true);

        // Should have executed 4 times (6 total - 2 skipped)
        expect(mockLab.execute).toHaveBeenCalledTimes(4);

        // Should exit with 0 for success
        expect(mockExit).toHaveBeenCalledWith(0);

        // Restore
        process.exit = originalExit;
        global.import = originalImport;
    });
});
