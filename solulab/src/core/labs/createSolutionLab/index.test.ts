import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { createSolutionLab } from './index';

describe('createSolutionLab', () => {
    test('creates a lab with valid configuration', () => {
        const lab = createSolutionLab({
            name: 'test-lab',
            description: 'A test lab',
            paramSchema: z.object({
                input: z.string(),
            }),
            resultSchema: z.object({
                output: z.string(),
            }),
            versions: [
                {
                    name: 'v1',
                    execute: async (params) => ({ output: params.input.toUpperCase() }),
                },
            ],
            cases: [
                {
                    name: 'case1',
                    arguments: { input: 'hello' },
                },
            ],
        });

        expect(lab.definition.name).toBe('test-lab');
        expect(lab.definition.description).toBe('A test lab');
        expect(lab.definition.versions).toEqual(['v1']);
        expect(lab.definition.cases).toEqual(['case1']);
    });

    test('throws error when resultSchema is not an object', () => {
        expect(() => {
            createSolutionLab({
                name: 'invalid-lab',
                description: 'Invalid lab',
                paramSchema: z.object({ input: z.string() }),
                resultSchema: z.string() as any,
                versions: [],
                cases: [],
            });
        }).toThrow('must have an object resultSchema');
    });

    test('executes a specific version and case', async () => {
        const lab = createSolutionLab({
            name: 'exec-test',
            description: 'Execution test',
            paramSchema: z.object({
                value: z.number(),
            }),
            resultSchema: z.object({
                doubled: z.number(),
            }),
            versions: [
                {
                    name: 'double',
                    execute: async (params) => ({ doubled: params.value * 2 }),
                },
                {
                    name: 'triple',
                    execute: async (params) => ({ doubled: params.value * 3 }),
                },
            ],
            cases: [
                {
                    name: 'five',
                    arguments: { value: 5 },
                },
                {
                    name: 'ten',
                    arguments: { value: 10 },
                },
            ],
        });

        const result = await lab.execute('double', 'five');

        expect(result.labName).toBe('exec-test');
        expect(result.versionName).toBe('double');
        expect(result.caseName).toBe('five');
        expect(result.params).toEqual({ value: 5 });
        expect(result.result).toEqual({ doubled: 10 });
        expect(result.duration).toBeGreaterThanOrEqual(0);
        expect(result.timestamp).toBeDefined();
        expect(result.error).toBeUndefined();
    });

    test('handles execution errors gracefully', async () => {
        const lab = createSolutionLab({
            name: 'error-test',
            description: 'Error test',
            paramSchema: z.object({
                shouldFail: z.boolean(),
            }),
            resultSchema: z.object({
                success: z.boolean(),
            }),
            versions: [
                {
                    name: 'may-fail',
                    execute: async (params) => {
                        if (params.shouldFail) {
                            throw new Error('Intentional failure');
                        }
                        return { success: true };
                    },
                },
            ],
            cases: [
                {
                    name: 'fail-case',
                    arguments: { shouldFail: true },
                },
                {
                    name: 'success-case',
                    arguments: { shouldFail: false },
                },
            ],
        });

        const failResult = await lab.execute('may-fail', 'fail-case');
        expect(failResult.error).toBe('Intentional failure');
        expect(failResult.result).toBeNull();

        const successResult = await lab.execute('may-fail', 'success-case');
        expect(successResult.error).toBeUndefined();
        expect(successResult.result).toEqual({ success: true });
    });

    test('throws error for non-existent version', async () => {
        const lab = createSolutionLab({
            name: 'version-test',
            description: 'Version test',
            paramSchema: z.object({}),
            resultSchema: z.object({ value: z.number() }),
            versions: [{ name: 'v1', execute: async () => ({ value: 1 }) }],
            cases: [{ name: 'case1', arguments: {} }],
        });

        await expect(lab.execute('non-existent', 'case1')).rejects.toThrow(
            'Version "non-existent" not found'
        );
    });

    test('throws error for non-existent case', async () => {
        const lab = createSolutionLab({
            name: 'case-test',
            description: 'Case test',
            paramSchema: z.object({}),
            resultSchema: z.object({ value: z.number() }),
            versions: [{ name: 'v1', execute: async () => ({ value: 1 }) }],
            cases: [{ name: 'case1', arguments: {} }],
        });

        await expect(lab.execute('v1', 'non-existent')).rejects.toThrow(
            'Case "non-existent" not found'
        );
    });

    test('validates parameters against schema', async () => {
        const lab = createSolutionLab({
            name: 'param-validation',
            description: 'Parameter validation',
            paramSchema: z.object({
                required: z.string(),
                optional: z.number().optional(),
            }),
            resultSchema: z.object({ ok: z.boolean() }),
            versions: [
                {
                    name: 'v1',
                    execute: async () => ({ ok: true }),
                },
            ],
            cases: [
                {
                    name: 'invalid-params',
                    arguments: { notRequired: 'test' } as any,
                },
            ],
        });

        const result = await lab.execute('v1', 'invalid-params');
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Invalid input');
    });

    test('validates result against schema', async () => {
        const lab = createSolutionLab({
            name: 'result-validation',
            description: 'Result validation',
            paramSchema: z.object({}),
            resultSchema: z.object({
                required: z.string(),
            }),
            versions: [
                {
                    name: 'invalid-return',
                    execute: async () => ({ notRequired: 'test' }) as any,
                },
            ],
            cases: [
                {
                    name: 'case1',
                    arguments: {},
                },
            ],
        });

        const result = await lab.execute('invalid-return', 'case1');
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Invalid input');
    });

    test('executeAll runs all version × case combinations', async () => {
        const lab = createSolutionLab({
            name: 'execute-all-test',
            description: 'Execute all test',
            paramSchema: z.object({
                n: z.number(),
            }),
            resultSchema: z.object({
                result: z.number(),
            }),
            versions: [
                {
                    name: 'add-one',
                    execute: async (params) => ({ result: params.n + 1 }),
                },
                {
                    name: 'add-two',
                    execute: async (params) => ({ result: params.n + 2 }),
                },
            ],
            cases: [
                {
                    name: 'zero',
                    arguments: { n: 0 },
                },
                {
                    name: 'five',
                    arguments: { n: 5 },
                },
                {
                    name: 'ten',
                    arguments: { n: 10 },
                },
            ],
        });

        const results = await lab.executeAll();

        expect(results).toHaveLength(6); // 2 versions × 3 cases

        // Check all combinations exist
        const combinations = results.map((r) => `${r.versionName}:${r.caseName}`);
        expect(combinations).toContain('add-one:zero');
        expect(combinations).toContain('add-one:five');
        expect(combinations).toContain('add-one:ten');
        expect(combinations).toContain('add-two:zero');
        expect(combinations).toContain('add-two:five');
        expect(combinations).toContain('add-two:ten');

        // Verify specific results
        const addOneZero = results.find(
            (r) => r.versionName === 'add-one' && r.caseName === 'zero'
        );
        expect(addOneZero?.result).toEqual({ result: 1 });

        const addTwoTen = results.find((r) => r.versionName === 'add-two' && r.caseName === 'ten');
        expect(addTwoTen?.result).toEqual({ result: 12 });
    });

    test('handles async execution correctly', async () => {
        const lab = createSolutionLab({
            name: 'async-test',
            description: 'Async test',
            paramSchema: z.object({
                delay: z.number(),
            }),
            resultSchema: z.object({
                completed: z.boolean(),
            }),
            versions: [
                {
                    name: 'delayed',
                    execute: async (params) => {
                        await new Promise((resolve) => setTimeout(resolve, params.delay));
                        return { completed: true };
                    },
                },
            ],
            cases: [
                {
                    name: 'quick',
                    arguments: { delay: 10 },
                },
            ],
        });

        const startTime = Date.now();
        const result = await lab.execute('delayed', 'quick');
        const elapsed = Date.now() - startTime;

        expect(result.result).toEqual({ completed: true });
        expect(elapsed).toBeGreaterThanOrEqual(10);
        expect(result.duration).toBeGreaterThanOrEqual(10);
    });
});
