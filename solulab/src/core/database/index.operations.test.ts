import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { LabResult } from '../types';
import { db } from './index.instance';
import {
    close,
    getLabByName,
    getLabResults,
    getLabs,
    getLatestResults,
    getOrCreateLab,
    getResultMatrix,
    hasResult,
    saveResult,
} from './index.operations';

describe('database operations', () => {
    const testDbPath = path.join(import.meta.dir, 'test-db.json');

    beforeEach(async () => {
        // Initialize with clean data
        db.data = {
            labs: [],
            labResults: [],
        };
        await db.write();
    });

    afterEach(async () => {
        // Clean up test database
        close();
        try {
            await fs.unlink(testDbPath);
        } catch {
            // Ignore if file doesn't exist
        }
    });

    describe('lab operations', () => {
        test('getLabs returns empty array initially', async () => {
            const labs = await getLabs();
            expect(labs).toEqual([]);
        });

        test('getLabs returns sorted labs by name', async () => {
            db.data.labs = [
                {
                    id: 1,
                    name: 'zebra',
                    description: 'Z lab',
                    paramSchema: '{}',
                    resultSchema: '{}',
                },
                {
                    id: 2,
                    name: 'alpha',
                    description: 'A lab',
                    paramSchema: '{}',
                    resultSchema: '{}',
                },
                {
                    id: 3,
                    name: 'beta',
                    description: 'B lab',
                    paramSchema: '{}',
                    resultSchema: '{}',
                },
            ];

            const labs = await getLabs();
            expect(labs).toHaveLength(3);
            expect(labs[0].name).toBe('alpha');
            expect(labs[1].name).toBe('beta');
            expect(labs[2].name).toBe('zebra');
        });

        test('getLabByName finds existing lab', async () => {
            db.data.labs = [
                {
                    id: 1,
                    name: 'test-lab',
                    description: 'Test',
                    paramSchema: '{}',
                    resultSchema: '{}',
                },
                {
                    id: 2,
                    name: 'other-lab',
                    description: 'Other',
                    paramSchema: '{}',
                    resultSchema: '{}',
                },
            ];

            const lab = await getLabByName('test-lab');
            expect(lab).toBeDefined();
            expect(lab?.id).toBe(1);
            expect(lab?.name).toBe('test-lab');
        });

        test('getLabByName returns undefined for non-existent lab', async () => {
            const lab = await getLabByName('non-existent');
            expect(lab).toBeUndefined();
        });

        test('getOrCreateLab creates new lab', async () => {
            const id = await getOrCreateLab(
                'new-lab',
                'A new lab',
                { type: 'object' },
                { type: 'object' }
            );

            expect(id).toBe(1);
            expect(db.data.labs).toHaveLength(1);
            expect(db.data.labs[0].name).toBe('new-lab');
            expect(db.data.labs[0].description).toBe('A new lab');
        });

        test('getOrCreateLab returns existing lab id', async () => {
            db.data.labs = [
                {
                    id: 42,
                    name: 'existing',
                    description: 'Exists',
                    paramSchema: '{}',
                    resultSchema: '{}',
                },
            ];

            const id = await getOrCreateLab('existing', 'Updated desc', {}, {});

            expect(id).toBe(42);
            expect(db.data.labs).toHaveLength(1);
            // Description should not be updated
            expect(db.data.labs[0].description).toBe('Exists');
        });

        test('getOrCreateLab generates correct sequential ids', async () => {
            const id1 = await getOrCreateLab('lab1', 'First', {}, {});
            const id2 = await getOrCreateLab('lab2', 'Second', {}, {});
            const id3 = await getOrCreateLab('lab3', 'Third', {}, {});

            expect(id1).toBe(1);
            expect(id2).toBe(2);
            expect(id3).toBe(3);
        });
    });

    describe('lab result operations', () => {
        beforeEach(async () => {
            // Set up test data
            db.data.labs = [
                {
                    id: 1,
                    name: 'lab1',
                    description: 'Lab 1',
                    paramSchema: '{}',
                    resultSchema: '{}',
                },
                {
                    id: 2,
                    name: 'lab2',
                    description: 'Lab 2',
                    paramSchema: '{}',
                    resultSchema: '{}',
                },
            ];

            db.data.labResults = [
                {
                    id: 1,
                    labId: 1,
                    versionName: 'v1',
                    caseName: 'case1',
                    params: '{}',
                    result: '{"value": 1}',
                    timestamp: '2024-01-01T10:00:00Z',
                    duration: 100,
                    error: null,
                },
                {
                    id: 2,
                    labId: 1,
                    versionName: 'v2',
                    caseName: 'case1',
                    params: '{}',
                    result: '{"value": 2}',
                    timestamp: '2024-01-01T11:00:00Z',
                    duration: 150,
                    error: null,
                },
                {
                    id: 3,
                    labId: 2,
                    versionName: 'v1',
                    caseName: 'case1',
                    params: '{}',
                    result: '{"value": 3}',
                    timestamp: '2024-01-01T12:00:00Z',
                    duration: 200,
                    error: null,
                },
            ];
        });

        test('getLabResults returns all results sorted by timestamp desc', async () => {
            const results = await getLabResults();

            expect(results).toHaveLength(3);
            expect(results[0].timestamp).toBe('2024-01-01T12:00:00Z');
            expect(results[1].timestamp).toBe('2024-01-01T11:00:00Z');
            expect(results[2].timestamp).toBe('2024-01-01T10:00:00Z');
        });

        test('getLabResults filters by labId', async () => {
            const results = await getLabResults(1);

            expect(results).toHaveLength(2);
            expect(results.every((r) => r.labId === 1)).toBe(true);
        });

        test('getLatestResults includes lab names', async () => {
            const results = await getLatestResults();

            expect(results).toHaveLength(3);
            expect(results[0].labName).toBe('lab2');
            expect(results[1].labName).toBe('lab1');
            expect(results[2].labName).toBe('lab1');
        });

        test('getLatestResults handles missing lab gracefully', async () => {
            db.data.labResults.push({
                id: 4,
                labId: 999, // Non-existent lab
                versionName: 'v1',
                caseName: 'case1',
                params: '{}',
                result: '{}',
                timestamp: '2024-01-01T13:00:00Z',
                duration: 50,
                error: null,
            });

            const results = await getLatestResults();
            const orphanResult = results.find((r) => r.id === 4);

            expect(orphanResult).toBeDefined();
            expect(orphanResult?.labName).toBe('Unknown');
        });

        test('hasResult checks existence correctly', async () => {
            const exists = await hasResult(1, 'v1', 'case1');
            expect(exists).toBe(true);

            const notExists = await hasResult(1, 'v3', 'case1');
            expect(notExists).toBe(false);

            const wrongLab = await hasResult(3, 'v1', 'case1');
            expect(wrongLab).toBe(false);
        });

        test('saveResult adds new result', async () => {
            const labResult: LabResult<any, any> = {
                labName: 'lab1',
                versionName: 'v3',
                caseName: 'case2',
                params: { input: 'test' },
                result: { output: 'result' },
                timestamp: '2024-01-02T10:00:00Z',
                duration: 250,
            };

            await saveResult(1, labResult);

            expect(db.data.labResults).toHaveLength(4);
            const saved = db.data.labResults[3];
            expect(saved.versionName).toBe('v3');
            expect(saved.caseName).toBe('case2');
            expect(saved.params).toBe('{"input":"test"}');
            expect(saved.result).toBe('{"output":"result"}');
        });

        test('saveResult skips duplicate results', async () => {
            const labResult: LabResult<any, any> = {
                labName: 'lab1',
                versionName: 'v1',
                caseName: 'case1', // Already exists
                params: { different: 'params' },
                result: { different: 'result' },
                timestamp: '2024-01-02T10:00:00Z',
                duration: 300,
            };

            await saveResult(1, labResult);

            // Should still have 3 results
            expect(db.data.labResults).toHaveLength(3);
        });

        test('saveResult handles error results', async () => {
            const labResult: LabResult<any, any> = {
                labName: 'lab1',
                versionName: 'v4',
                caseName: 'error-case',
                params: {},
                result: null,
                timestamp: '2024-01-02T11:00:00Z',
                duration: 50,
                error: 'Something went wrong',
            };

            await saveResult(1, labResult);

            const saved = db.data.labResults[3];
            expect(saved.error).toBe('Something went wrong');
            expect(saved.result).toBe('null');
        });
    });

    describe('getResultMatrix', () => {
        beforeEach(async () => {
            db.data.labResults = [
                {
                    id: 1,
                    labId: 1,
                    versionName: 'v1',
                    caseName: 'case1',
                    params: '{}',
                    result: '{"value": 1}',
                    timestamp: '2024-01-01T10:00:00Z',
                    duration: 100,
                    error: null,
                },
                {
                    id: 2,
                    labId: 1,
                    versionName: 'v1',
                    caseName: 'case2',
                    params: '{}',
                    result: '{"value": 2}',
                    timestamp: '2024-01-01T10:01:00Z',
                    duration: 110,
                    error: null,
                },
                {
                    id: 3,
                    labId: 1,
                    versionName: 'v2',
                    caseName: 'case1',
                    params: '{}',
                    result: '{"value": 3}',
                    timestamp: '2024-01-01T10:02:00Z',
                    duration: 120,
                    error: null,
                },
                {
                    id: 4,
                    labId: 2, // Different lab
                    versionName: 'v1',
                    caseName: 'case1',
                    params: '{}',
                    result: '{"value": 4}',
                    timestamp: '2024-01-01T10:03:00Z',
                    duration: 130,
                    error: null,
                },
            ];
        });

        test('builds correct matrix for lab', async () => {
            const matrix = await getResultMatrix(1);

            expect(matrix.versions).toEqual(['v1', 'v2']);
            expect(matrix.cases).toEqual(['case1', 'case2']);
            expect(matrix.results.size).toBe(3);

            const v1c1 = matrix.results.get('v1:case1');
            expect(v1c1?.id).toBe(1);

            const v1c2 = matrix.results.get('v1:case2');
            expect(v1c2?.id).toBe(2);

            const v2c1 = matrix.results.get('v2:case1');
            expect(v2c1?.id).toBe(3);

            const v2c2 = matrix.results.get('v2:case2');
            expect(v2c2).toBeUndefined(); // No result for this combination
        });

        test('returns empty matrix for lab with no results', async () => {
            const matrix = await getResultMatrix(999);

            expect(matrix.versions).toEqual([]);
            expect(matrix.cases).toEqual([]);
            expect(matrix.results.size).toBe(0);
        });

        test('handles single result correctly', async () => {
            const matrix = await getResultMatrix(2);

            expect(matrix.versions).toEqual(['v1']);
            expect(matrix.cases).toEqual(['case1']);
            expect(matrix.results.size).toBe(1);
        });
    });

    describe('close', () => {
        test('close function exists and can be called', () => {
            expect(() => close()).not.toThrow();
        });
    });
});
