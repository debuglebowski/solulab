import type { BaseLabResult } from './index.base';

// In-memory lab result (single execution of version + case)
export interface LabResult<TParams = unknown, TResult = unknown> extends BaseLabResult {
    labName: string;
    params: TParams;
    result: TResult;
    error?: string;
}
