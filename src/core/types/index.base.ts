// Base types that serve as foundations for other types

// Base lab metadata (shared between in-memory and persistent labs)
export interface BaseLabMetadata {
    name: string;
    description: string;
}

// Base execution result properties (shared between in-memory and persistent results)
export interface BaseLabResult {
    versionName: string;
    caseName: string;
    timestamp: string;
    duration: number;
}

// Base persistent entity with database ID
export interface PersistentEntity {
    id: number;
}
