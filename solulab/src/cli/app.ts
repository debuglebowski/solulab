import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import chalk from 'chalk';
import open from 'open';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SolutionLabsConfig } from './config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// MIME types for static files
const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

function getMimeType(filePath: string): string {
    const ext = path.extname(filePath);

    return MIME_TYPES[ext] || 'application/octet-stream';
}

async function handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    dbPath: string,
    clientDir: string
): Promise<void> {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    try {
        // API endpoint for database
        if (url.pathname === '/api/database') {
            if (!existsSync(dbPath)) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Database file not found' }));

                return;
            }

            const data = await readFile(dbPath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(data);

            return;
        }

        // Serve static assets
        if (url.pathname.startsWith('/assets/')) {
            const assetPath = path.join(clientDir, url.pathname);

            if (!existsSync(assetPath)) {
                res.statusCode = 404;
                res.end('Not found');

                return;
            }

            const content = await readFile(assetPath);
            res.setHeader('Content-Type', getMimeType(assetPath));
            res.end(content);

            return;
        }

        // Serve index.html for all other routes (SPA routing)
        const indexPath = path.join(clientDir, 'index.html');

        if (!existsSync(indexPath)) {
            res.statusCode = 500;
            res.end('Client build not found. Please run "bun run build" first.');

            return;
        }

        const html = await readFile(indexPath, 'utf-8');
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
    } catch (error) {
        console.error('Server error:', error);
        res.statusCode = 500;
        res.end('Internal server error');
    }
}

export async function app(config: SolutionLabsConfig) {
    console.log(chalk.blue('🚀 Starting Solulab visualization server...'));

    const dbPath = path.resolve(process.cwd(), config.dbPath || '.solulab/solulab.json');

    // Check if database file exists
    if (!existsSync(dbPath)) {
        console.error(chalk.red(`❌ Database file not found: ${dbPath}`));
        console.log(chalk.yellow('   Run "solulab run" first to generate lab results'));
        process.exit(1);
    }

    // Determine if we're running from source (development) or dist (production)
    const isRunningFromSource = __dirname.includes('/src/');

    if (isRunningFromSource) {
        // In development, use Vite dev server
        console.log(chalk.yellow('📦 Running in development mode, starting Vite...'));
        const { createServer: createViteServer } = await import('vite');
        const viteServer = await createViteServer({
            configFile: path.join(__dirname, '../../vite.config.ts'),
            server: {
                port: parseInt(process.env.PORT || '3000', 10),
                open: false,
                middlewareMode: false,
            },
            plugins: [
                {
                    name: 'solulab-database-api',
                    configureServer(server) {
                        server.middlewares.use('/api/database', async (_req, res) => {
                            try {
                                if (!existsSync(dbPath)) {
                                    res.statusCode = 404;
                                    res.end(JSON.stringify({ error: 'Database file not found' }));

                                    return;
                                }

                                const data = await readFile(dbPath, 'utf-8');
                                res.setHeader('Content-Type', 'application/json');
                                res.end(data);
                            } catch (_error) {
                                res.statusCode = 500;
                                res.end(JSON.stringify({ error: 'Failed to read database' }));
                            }
                        });
                    },
                },
            ],
        });

        await viteServer.listen();
        const url = `http://localhost:${viteServer.config.server.port}`;
        console.log(chalk.green(`✨ Development server running at ${chalk.cyan(url)}`));
        console.log(chalk.gray(`   Using database: ${dbPath}`));
        console.log(chalk.gray('   Press Ctrl+C to stop'));

        // Open browser
        await open(url);

        return;
    }

    // Production mode - use built client
    const clientDir = path.join(__dirname, '../../dist/ui');

    if (!existsSync(clientDir)) {
        console.error(chalk.red('❌ Client build not found. Please run "bun run build" first.'));
        process.exit(1);
    }

    // Create HTTP server
    const port = parseInt(process.env.PORT || '3000', 10);
    const server = createServer((req, res) => handleRequest(req, res, dbPath, clientDir));

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
            console.error(chalk.red(`❌ Port ${port} is already in use`));
            process.exit(1);
        }
        console.error(chalk.red('❌ Server error:'), error);
        process.exit(1);
    });

    // Start server
    server.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log(chalk.green(`✨ Visualization server running at ${chalk.cyan(url)}`));
        console.log(chalk.gray(`   Using database: ${dbPath}`));
        console.log(chalk.gray('   Press Ctrl+C to stop'));

        // Open browser
        open(url);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n👋 Shutting down server...'));
        server.close(() => {
            process.exit(0);
        });
    });
}
