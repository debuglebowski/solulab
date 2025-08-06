import type { z } from 'zod';
import type { BaseLabMetadata } from './index.base';
import type { LabResult } from './index.result';

// Lab version definition
export interface LabVersion<TParams, TResult> {
    name: string;
    execute: (params: TParams) => TResult | Promise<TResult>;
}

// Lab case definition
export interface LabCase<TParams> {
    name: string;
    arguments: TParams;
}

/**
 * Lab options for creating a lab.
 * 
 * Note on type checking:
 * - Missing properties in execute() returns are caught at compile time
 * - Excess properties are caught at runtime by Zod validation
 * - This is due to TypeScript's structural typing in return positions
 */
export interface LabOptions<
    TParamSchema extends z.ZodSchema,
    TResultSchema extends z.ZodSchema
> extends BaseLabMetadata {
    paramSchema: TParamSchema;
    resultSchema: TResultSchema;
    versions: LabVersion<z.infer<TParamSchema>, z.infer<TResultSchema>>[];
    cases: LabCase<z.infer<TParamSchema>>[];
}

// Lab definition for discovery (in-memory lab metadata with runtime info)
export interface LabDefinition extends BaseLabMetadata {
    paramSchema: unknown;
    resultSchema: unknown;
    versions: string[]; // version names
    cases: string[]; // case names
    filePath: string;
}

// Lab instance returned by createSolutionLab
export interface Lab<TParams, TResult> {
    definition: LabDefinition;
    execute: (versionName: string, caseName: string) => Promise<LabResult<TParams, TResult>>;
    executeAll: () => Promise<LabResult<TParams, TResult>[]>;
}
