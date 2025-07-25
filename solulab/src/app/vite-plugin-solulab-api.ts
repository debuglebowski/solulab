import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';
import { getCachedTestDatabase } from './lib/testData';

export function solulabApiPlugin(options: { dbPath?: string } = {}): Plugin {
    const dbPath = path.resolve(process.cwd(), options.dbPath || '.solulab/solulab.json');

    return {
        name: 'solulab-api',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (req.url !== '/api/database') {
                    return next();
                }

                try {
                    let data: string;

                    // Check if a real database file exists
                    if (existsSync(dbPath)) {
                        // Use real database if available
                        data = await readFile(dbPath, 'utf-8');
                        console.log('[solulab-api] Serving real database from:', dbPath);
                    } else {
                        // Use test data if no database exists
                        const testDatabase = getCachedTestDatabase();
                        data = JSON.stringify(testDatabase, null, 2);
                        console.log('[solulab-api] Serving test data (no database found at:', dbPath + ')');
                    }

                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Cache-Control', 'no-cache');
                    res.end(data);
                } catch (error) {
                    console.error('[solulab-api] Error:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Failed to read database' }));
                }
            });
        },
    };
}