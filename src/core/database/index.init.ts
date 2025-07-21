import * as fs from 'node:fs';
import * as path from 'node:path';
import { JSONFilePreset } from 'lowdb/node';
import type { DatabaseSchema, Database } from './index.types';

const DEFAULT_DB_PATH = '.solulab/solulab.json';

let db: Database | null = null;
let initialized = false;

export async function ensureInitialized(): Promise<Database> {
    if (initialized && db) {
        return db;
    }

    const dir = path.dirname(DEFAULT_DB_PATH);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    db = await JSONFilePreset<DatabaseSchema>(DEFAULT_DB_PATH, {
        labs: [],
        labResults: [],
    });

    initialized = true;

    return db;
}

export function getDb(): Database {
    if (!db) {
        throw new Error('Database not initialized. Call ensureInitialized first.');
    }

    return db;
}

export function getNextId(array: { id: number }[]): number {
    return array.length === 0 ? 1 : Math.max(...array.map((item) => item.id)) + 1;
}
