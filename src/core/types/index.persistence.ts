import type { BaseLabMetadata, BaseLabResult, PersistentEntity } from './index.base';

// Persistent lab (database version of lab metadata with serialized schemas)
export interface PersistentLab extends BaseLabMetadata, PersistentEntity {
    paramSchema: string;
    resultSchema: string;
}

// Persistent lab result (database version with IDs and serialized data)
export interface PersistentLabResult extends BaseLabResult, PersistentEntity {
    labId: number;
    params: string;
    result: string;
    error: string | null;
}
