import type { DatabaseSchema } from '@/core/database/index.types';
import type { PersistentLab, PersistentLabResult } from '@/core/types';

// Serialized Zod schema for objects (simplified representation)
const OBJECT_SCHEMA = JSON.stringify({
    unknownKeys: 'strip',
    catchall: { _def: { typeName: 'ZodNever' }, '~standard': { version: 1, vendor: 'zod' } },
    typeName: 'ZodObject',
});

// Generate timestamps over the past week
function generateTimestamp(daysAgo: number, hoursOffset: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(date.getHours() + hoursOffset);
    return date.toISOString();
}

// Generate realistic CPU usage data
function generateCpuUsage(): number {
    // Base usage between 10-30%
    const base = 10 + Math.random() * 20;
    // Add some spikes
    const spike = Math.random() > 0.8 ? Math.random() * 50 : 0;
    return Math.round((base + spike) * 100) / 100;
}

// Generate realistic memory usage data
function generateMemoryUsage(): number {
    // Base usage between 40-60%
    const base = 40 + Math.random() * 20;
    // Add some variation
    const variation = (Math.random() - 0.5) * 10;
    return Math.round((base + variation) * 100) / 100;
}

// Generate test database with realistic patterns
export function generateTestDatabase(): DatabaseSchema {
    const labs: PersistentLab[] = [
        {
            id: 1,
            name: 'Performance Benchmark',
            description: 'Comprehensive performance testing across different algorithms',
            paramSchema: OBJECT_SCHEMA,
            resultSchema: OBJECT_SCHEMA,
        },
        {
            id: 2,
            name: 'Memory Analyzer',
            description: 'Analyzes memory usage patterns and potential leaks',
            paramSchema: OBJECT_SCHEMA,
            resultSchema: OBJECT_SCHEMA,
        },
        {
            id: 3,
            name: 'Algorithm Comparison',
            description: 'Compares different sorting and searching algorithms',
            paramSchema: OBJECT_SCHEMA,
            resultSchema: OBJECT_SCHEMA,
        },
        {
            id: 4,
            name: 'Network Latency',
            description: 'Tests network latency across different endpoints',
            paramSchema: OBJECT_SCHEMA,
            resultSchema: OBJECT_SCHEMA,
        },
        {
            id: 5,
            name: 'Database Query Performance',
            description: 'Benchmarks database query performance with different optimizations',
            paramSchema: OBJECT_SCHEMA,
            resultSchema: OBJECT_SCHEMA,
        },
    ];

    const labResults: PersistentLabResult[] = [];
    let resultId = 1;

    // Generate results for Performance Benchmark
    const perfVersions = ['baseline', 'optimized', 'parallel'];
    const perfCases = ['small dataset', 'medium dataset', 'large dataset'];

    for (let day = 0; day < 7; day++) {
        for (const version of perfVersions) {
            for (const testCase of perfCases) {
                const baseTime = testCase === 'small dataset' ? 50 : testCase === 'medium dataset' ? 200 : 1000;
                const multiplier = version === 'baseline' ? 1 : version === 'optimized' ? 0.7 : 0.4;

                labResults.push({
                    id: resultId++,
                    labId: 1,
                    versionName: version,
                    caseName: testCase,
                    params: JSON.stringify({ iterations: 1000 }),
                    result: JSON.stringify({
                        executionTime: Math.round(baseTime * multiplier + Math.random() * 20),
                        throughput: Math.round(1000 / (baseTime * multiplier) * 1000),
                        cpuUsage: generateCpuUsage(),
                    }),
                    timestamp: generateTimestamp(day, Math.floor(Math.random() * 24)),
                    duration: Math.round(baseTime * multiplier),
                    error: null,
                });
            }
        }
    }

    // Generate results for Memory Analyzer
    const memVersions = ['standard gc', 'aggressive gc', 'no gc'];
    const memCases = ['idle', 'moderate load', 'heavy load'];

    for (let day = 0; day < 5; day++) {
        for (const version of memVersions) {
            for (const testCase of memCases) {
                const baseMemory = testCase === 'idle' ? 100 : testCase === 'moderate load' ? 500 : 2000;
                const gcMultiplier = version === 'no gc' ? 1.5 : version === 'aggressive gc' ? 0.8 : 1;

                labResults.push({
                    id: resultId++,
                    labId: 2,
                    versionName: version,
                    caseName: testCase,
                    params: JSON.stringify({ duration: 60 }),
                    result: JSON.stringify({
                        heapUsed: Math.round(baseMemory * gcMultiplier + Math.random() * 50),
                        heapTotal: Math.round(baseMemory * gcMultiplier * 1.5),
                        memoryLeakDetected: version === 'no gc' && testCase === 'heavy load',
                        percentUsed: generateMemoryUsage(),
                    }),
                    timestamp: generateTimestamp(day, Math.floor(Math.random() * 24)),
                    duration: 60000,
                    error: null,
                });
            }
        }
    }

    // Generate results for Algorithm Comparison
    const algoVersions = ['bubble sort', 'quick sort', 'merge sort', 'heap sort'];
    const algoCases = ['sorted', 'reverse sorted', 'random'];

    for (const version of algoVersions) {
        for (const testCase of algoCases) {
            const complexity =
                version === 'bubble sort'
                    ? 1000
                    : version === 'quick sort'
                      ? 100
                      : version === 'merge sort'
                        ? 120
                        : 110;
            const caseMultiplier =
                testCase === 'sorted' ? 0.5 : testCase === 'reverse sorted' ? 1.5 : 1;

            labResults.push({
                id: resultId++,
                labId: 3,
                versionName: version,
                caseName: testCase,
                params: JSON.stringify({ arraySize: 10000 }),
                result: JSON.stringify({
                    comparisons: Math.round(complexity * caseMultiplier * 10000),
                    swaps: Math.round(complexity * caseMultiplier * 5000),
                    timeMs: Math.round(complexity * caseMultiplier),
                }),
                timestamp: generateTimestamp(2, Math.floor(Math.random() * 24)),
                duration: Math.round(complexity * caseMultiplier),
                error: null,
            });
        }
    }

    // Generate some error cases
    labResults.push({
        id: resultId++,
        labId: 4,
        versionName: 'http',
        caseName: 'unreachable host',
        params: JSON.stringify({ endpoint: 'http://invalid.local' }),
        result: JSON.stringify({}),
        timestamp: generateTimestamp(1),
        duration: 5000,
        error: 'Error: ENOTFOUND: Host not found',
    });

    labResults.push({
        id: resultId++,
        labId: 5,
        versionName: 'indexed query',
        caseName: 'complex join',
        params: JSON.stringify({ tables: 5 }),
        result: JSON.stringify({}),
        timestamp: generateTimestamp(0),
        duration: 30000,
        error: 'Error: Query timeout after 30s',
    });

    // Add some successful network latency results
    const endpoints = ['local', 'regional', 'global'];
    for (const endpoint of endpoints) {
        const baseLatency = endpoint === 'local' ? 5 : endpoint === 'regional' ? 50 : 200;

        labResults.push({
            id: resultId++,
            labId: 4,
            versionName: 'https',
            caseName: endpoint,
            params: JSON.stringify({ endpoint: `https://api.${endpoint}.example.com` }),
            result: JSON.stringify({
                latencyMs: baseLatency + Math.random() * 20,
                packetLoss: Math.random() * 2,
                jitter: Math.random() * 5,
            }),
            timestamp: generateTimestamp(0, Math.floor(Math.random() * 12)),
            duration: baseLatency + 10,
            error: null,
        });
    }

    return {
        labs,
        labResults,
    };
}

// Cache for consistent test data during development session
let cachedTestData: DatabaseSchema | null = null;

export function getCachedTestDatabase(): DatabaseSchema {
    if (!cachedTestData) {
        cachedTestData = generateTestDatabase();
    }
    return cachedTestData;
}
