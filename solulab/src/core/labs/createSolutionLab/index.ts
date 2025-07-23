import type { z } from 'zod';
import type { Lab, LabDefinition, LabOptions, LabResult } from '../../types';

export function createSolutionLab<TParams, TResult extends Record<string, unknown>>(
    options: LabOptions<TParams, TResult> & {
        resultSchema: z.ZodObject<z.ZodRawShape, 'strip', z.ZodTypeAny, TResult>;
    }
): Lab<TParams, TResult> {
    const { name, description, paramSchema, resultSchema, versions, cases } = options;

    // Enforce that resultSchema is a ZodObject
    if (!resultSchema._def || resultSchema._def.typeName !== 'ZodObject') {
        throw new Error(
            `Lab "${name}" must have an object resultSchema. Use z.object({...}) instead of primitive schemas.`
        );
    }

    // Create lab definition for discovery
    const definition: LabDefinition = {
        name,
        description,
        paramSchema: paramSchema._def,
        resultSchema: resultSchema._def,
        versions: versions.map((v) => v.name),
        cases: cases.map((c) => c.name),
        filePath: '', // Will be set by discovery
    };

    // Execute a specific version with a specific case
    async function execute(
        versionName: string,
        caseName: string
    ): Promise<LabResult<TParams, TResult>> {
        const version = versions.find((v) => v.name === versionName);

        if (!version) {
            throw new Error(`Version "${versionName}" not found in lab "${name}"`);
        }

        const testCase = cases.find((c) => c.name === caseName);

        if (!testCase) {
            throw new Error(`Case "${caseName}" not found in lab "${name}"`);
        }

        const startTime = Date.now();
        const timestamp = new Date().toISOString();

        try {
            // Validate parameters
            const params = paramSchema.parse(testCase.arguments);

            // Execute the version with the case parameters
            const rawResult = await version.execute(params);

            // Validate result
            const result = resultSchema.parse(rawResult);

            const duration = Date.now() - startTime;

            return {
                labName: name,
                versionName,
                caseName,
                params,
                result,
                timestamp,
                duration,
            };
        } catch (error) {
            const duration = Date.now() - startTime;

            return {
                labName: name,
                versionName,
                caseName,
                params: testCase.arguments,
                result: null as unknown as TResult,
                timestamp,
                duration,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    // Execute all version × case combinations
    async function executeAll(): Promise<LabResult<TParams, TResult>[]> {
        const results: LabResult<TParams, TResult>[] = [];

        for (const version of versions) {
            for (const testCase of cases) {
                const result = await execute(version.name, testCase.name);
                results.push(result);
            }
        }

        return results;
    }

    return {
        definition,
        execute,
        executeAll,
    };
}
