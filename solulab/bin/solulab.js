#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Check if we have a dist folder (production) or should use source (development)
const distPath = join(__dirname, '../dist/cli/index.js');
const srcPath = join(__dirname, '../src/cli/index.ts');

if (existsSync(distPath)) {
    // Production: use compiled version
    await import(distPath);
} else if (existsSync(srcPath)) {
    // Development: use source with Bun
    await import(srcPath);
} else {
    console.error('Error: Could not find CLI entry point');
    process.exit(1);
}
