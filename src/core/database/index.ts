import {
    close,
    getLabs,
    getLabByName,
    getOrCreateLab,
    getLabResults,
    getLatestResults,
    hasResult,
    saveResult,
    getResultMatrix,
} from './index.operations';

export const database = {
    // Lab operations
    getLabs,
    getLabByName,
    getOrCreateLab,

    // Result operations
    getLabResults,
    getLatestResults,
    hasResult,
    saveResult,
    getResultMatrix,

    // Utility
    close,
};

// Re-export types that might be needed externally
export type { DatabaseSchema } from './index.types';
