// Re-export all types from organized files to maintain existing API

// Base types
export type { BaseLabMetadata, BaseLabResult, PersistentEntity } from './index.base';

// Lab-related types
export type { Lab, LabCase, LabDefinition, LabOptions, LabVersion } from './index.lab';
// Persistence types
export type { PersistentLab, PersistentLabResult } from './index.persistence';
// Result types
export type { LabResult } from './index.result';
