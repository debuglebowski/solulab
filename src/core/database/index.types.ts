import type { PersistentLab, PersistentLabResult } from '../types';
import type { Low } from 'lowdb';

export interface DatabaseSchema {
    labs: PersistentLab[];
    labResults: PersistentLabResult[];
}

export type Database = Low<DatabaseSchema>;
