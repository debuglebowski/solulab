import { z } from 'zod';
import type { Lab, LabDefinition, LabOptions, LabResult } from '../../types';

/**
 * Creates a solution lab with type-safe parameters and results.
 *
 * Type checking behavior:
 * - Compile time: TypeScript catches missing required properties
 * - Runtime: Zod validation catches both missing and excess properties
 *
 * @example
 * ```typescript
 * const lab = createSolutionLab({
 *   resultSchema: z.object({ value: z.number() }),
 *   versions: [{
 *     execute: () => ({ value: 42 }) // ✅ Valid
 *     execute: () => ({})            // ❌ Compile error: missing 'value'
 *     execute: () => ({ value: 42, extra: 1 }) // ⚠️ Allowed at compile time, caught at runtime
 *   }]
 * })
 * ```
 */
export function createSolutionLab<
    TParamSchema extends z.ZodSchema,
    TResultSchema extends z.ZodObject<z.ZodRawShape>,
>(
    options: LabOptions<TParamSchema, TResultSchema>
): Lab<z.infer<TParamSchema>, z.infer<TResultSchema>> {
    const { name, description, paramSchema, resultSchema, versions, cases } = options;

    // Enforce that resultSchema is a ZodObject
    if (!(resultSchema instanceof z.ZodObject)) {
        throw new Error(
            `Lab "${name}" must have an object resultSchema. Use z.object({...}) instead of primitive schemas.`
        );
    }

    // Create lab definition for discovery
    const definition: LabDefinition = {
        name,
        description,
        paramSchema: z.toJSONSchema(paramSchema),
        resultSchema: z.toJSONSchema(resultSchema),
        versions: versions.map((v) => v.name),
        cases: cases.map((c) => c.name),
        filePath: '', // Will be set by discovery
    };

    // Execute a specific version with a specific case
    async function execute(
        versionName: string,
        caseName: string
    ): Promise<LabResult<z.infer<TParamSchema>, z.infer<TResultSchema>>> {
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
                result: null as unknown as z.infer<TResultSchema>,
                timestamp,
                duration,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    // Execute all version × case combinations
    async function executeAll(): Promise<
        LabResult<z.infer<TParamSchema>, z.infer<TResultSchema>>[]
    > {
        const results: LabResult<z.infer<TParamSchema>, z.infer<TResultSchema>>[] = [];

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
