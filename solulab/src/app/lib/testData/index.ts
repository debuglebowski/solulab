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

// Generate test database focused on demonstrating comparison features
export function generateTestDatabase(): DatabaseSchema {
    const labs: PersistentLab[] = [
        {
            id: 1,
            name: 'Log Analysis',
            description: 'Analyzes and processes various types of log outputs',
            paramSchema: OBJECT_SCHEMA,
            resultSchema: OBJECT_SCHEMA,
        },
        {
            id: 2,
            name: 'Performance Metrics',
            description: 'Measures performance metrics for comparison',
            paramSchema: OBJECT_SCHEMA,
            resultSchema: OBJECT_SCHEMA,
        },
    ];

    const labResults: PersistentLabResult[] = [];
    let resultId = 1;

    // Generate results for Log Analysis with long text outputs
    const logVersions = ['v1.0', 'v2.0', 'v3.0'];
    const logCases = ['application logs', 'error traces'];

    // Sample log templates
    const appLogTemplate = `[{{TIME}}] INFO: Application started successfully
[{{TIME}}] DEBUG: Loading configuration from /etc/app/config.yaml
[{{TIME}}] INFO: Database connection established
[{{TIME}}] WARN: Deprecated API endpoint /v1/users accessed
[{{TIME}}] INFO: Processing batch job #{{JOB}}
[{{TIME}}] DEBUG: Cache hit ratio: {{RATIO}}%
[{{TIME}}] INFO: Request processed in {{DURATION}}ms
[{{TIME}}] WARN: Memory usage approaching threshold: {{MEMORY}}%
[{{TIME}}] INFO: Scheduled maintenance task completed
[{{TIME}}] DEBUG: Cleanup process removed {{FILES}} temporary files`;

    const errorTraceTemplate = `Error: Connection timeout after {{TIMEOUT}}ms
    at Socket.emit (events.js:315:20)
    at Socket._onTimeout (net.js:481:8)
    at listOnTimeout (internal/timers.js:554:17)
    at processTimers (internal/timers.js:497:7)
    at Database.connect (/app/src/database/connection.js:{{LINE}}:15)
    at async Application.initialize (/app/src/app.js:{{LINE2}}:5)
    at async main (/app/src/index.js:{{LINE3}}:3)

System Info:
  Node Version: {{NODE}}
  OS: {{OS}}
  Memory: {{MEM}}
  CPU: {{CPU}}

Additional Context:
  User ID: {{USER}}
  Request ID: {{REQ}}
  Timestamp: {{TIME}}`;

    for (const version of logVersions) {
        for (const testCase of logCases) {
            const isError = testCase === 'error traces';
            const template = isError ? errorTraceTemplate : appLogTemplate;
            
            // Generate dynamic content
            const result = template
                .replace(/{{TIME}}/g, () => new Date().toISOString())
                .replace('{{JOB}}', Math.floor(Math.random() * 10000).toString())
                .replace('{{RATIO}}', (85 + Math.random() * 10).toFixed(1))
                .replace('{{DURATION}}', Math.floor(50 + Math.random() * 200).toString())
                .replace('{{MEMORY}}', (75 + Math.random() * 20).toFixed(1))
                .replace('{{FILES}}', Math.floor(10 + Math.random() * 50).toString())
                .replace('{{TIMEOUT}}', '30000')
                .replace('{{LINE}}', Math.floor(100 + Math.random() * 50).toString())
                .replace('{{LINE2}}', Math.floor(40 + Math.random() * 20).toString())
                .replace('{{LINE3}}', Math.floor(10 + Math.random() * 5).toString())
                .replace('{{NODE}}', `v${version === 'v1.0' ? '14' : version === 'v2.0' ? '16' : '18'}.0.0`)
                .replace('{{OS}}', 'Linux 5.10.0-1234-generic')
                .replace('{{MEM}}', '8GB / 16GB')
                .replace('{{CPU}}', 'Intel Core i7-9700K @ 3.60GHz')
                .replace('{{USER}}', `user_${Math.random().toString(36).substr(2, 9)}`)
                .replace('{{REQ}}', `req_${Math.random().toString(36).substr(2, 9)}`)
                ;

            labResults.push({
                id: resultId++,
                labId: 1,
                versionName: version,
                caseName: testCase,
                params: JSON.stringify({ format: 'text' }),
                result: JSON.stringify(result),
                timestamp: generateTimestamp(0),
                duration: Math.floor(100 + Math.random() * 500),
                error: null,
            });
        }
    }

    // Generate results for Performance Metrics
    const perfVersions = ['baseline', 'optimized', 'experimental'];
    const perfCases = ['numeric metrics', 'json output', 'mixed content'];

    for (const version of perfVersions) {
        for (const testCase of perfCases) {
            let result: any;
            let error: string | null = null;
            
            if (testCase === 'numeric metrics') {
                const baseTime = 100;
                const multiplier = version === 'baseline' ? 1 : version === 'optimized' ? 0.6 : 0.8;
                result = {
                    executionTime: Math.round(baseTime * multiplier + Math.random() * 20),
                    throughput: Math.round(1000 / (baseTime * multiplier) * 100),
                    cpuUsage: generateCpuUsage(),
                    memoryUsage: generateMemoryUsage(),
                };
            } else if (testCase === 'json output') {
                result = {
                    config: {
                        version,
                        environment: 'production',
                        features: ['caching', 'compression', 'parallel processing'],
                        settings: {
                            maxThreads: version === 'experimental' ? 16 : 8,
                            cacheSize: '512MB',
                            timeout: 30000,
                        },
                    },
                    metrics: {
                        requests: Math.floor(1000 + Math.random() * 500),
                        errors: Math.floor(Math.random() * 10),
                        latency: {
                            p50: Math.floor(10 + Math.random() * 5),
                            p95: Math.floor(50 + Math.random() * 20),
                            p99: Math.floor(100 + Math.random() * 50),
                        },
                    },
                };
            } else {
                // Mixed content including markdown
                result = `# Performance Report - ${version}

## Summary
This is a performance analysis report for version **${version}** running test case "${testCase}".

## Metrics
- **Response Time**: ${50 + Math.random() * 100}ms
- **Memory Usage**: ${(40 + Math.random() * 30).toFixed(1)}%
- **CPU Usage**: ${(20 + Math.random() * 40).toFixed(1)}%

## Detailed Analysis
The system performed ${version === 'optimized' ? 'exceptionally well' : 'within expected parameters'} during the test period. Key observations include:

1. Consistent response times across all endpoints
2. Memory usage remained stable throughout the test
3. No significant bottlenecks were detected

## Recommendations
- ${version === 'baseline' ? 'Consider upgrading to optimized version' : 'Continue monitoring performance'}
- Review configuration settings for potential improvements
- Schedule regular performance audits

---
*Generated at ${new Date().toISOString()}*`;
            }

            // Add an error case for experimental version on mixed content
            if (version === 'experimental' && testCase === 'mixed content') {
                error = 'Feature not supported in experimental version';
                result = {};
            }

            labResults.push({
                id: resultId++,
                labId: 2,
                versionName: version,
                caseName: testCase,
                params: JSON.stringify({ iterations: 1000 }),
                result: JSON.stringify(result),
                timestamp: generateTimestamp(0),
                duration: Math.floor(100 + Math.random() * 500),
                error,
            });
        }
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
