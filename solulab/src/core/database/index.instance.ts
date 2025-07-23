import * as fs from 'node:fs';
import * as path from 'node:path';
import { JSONFilePreset } from 'lowdb/node';
import type { DatabaseSchema, Database } from './index.types';

const DEFAULT_DB_PATH = '.solulab/solulab.json';

// Create directory if it doesn't exist
const dir = path.dirname(DEFAULT_DB_PATH);

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Initialize database with top-level await
export const db: Database = await JSONFilePreset<DatabaseSchema>(DEFAULT_DB_PATH, {
    labs: [],
    labResults: [],
});
