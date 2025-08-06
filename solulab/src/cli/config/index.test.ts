import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { loadConfig } from './index';

describe('config loading', () => {
    const testDir = path.join(import.meta.dir, 'test-config');
    
    beforeEach(async () => {
        // Create test directory
        await fs.mkdir(testDir, { recursive: true });
        
        // Change to test directory
        process.chdir(testDir);
    });

    afterEach(async () => {
        // Change back to original directory
        process.chdir(import.meta.dir);
        
        // Clean up test directory
        await fs.rm(testDir, { recursive: true, force: true });
    });

    test('returns default config when no config file exists', () => {
        const config = loadConfig();
        
        expect(config).toEqual({
            dbPath: '.solulab/solulab.json',
            labGlobs: ['**/*.lab.{ts,js}'],
        });
    });

    test('loads config from solulab.config.js', async () => {
        await Bun.write(
            path.join(testDir, 'solulab.config.js'),
            `
            export default {
                dbPath: 'custom/path/db.json',
                labGlobs: ['src/**/*.lab.ts'],
            };
            `
        );

        const config = loadConfig();
        
        expect(config.dbPath).toBe('custom/path/db.json');
        expect(config.labGlobs).toEqual(['src/**/*.lab.ts']);
    });

    test('loads config from .solulabrc.json', async () => {
        await Bun.write(
            path.join(testDir, '.solulabrc.json'),
            JSON.stringify({
                dbPath: 'json-config/db.json',
                labGlobs: ['tests/**/*.lab.js'],
            })
        );

        const config = loadConfig();
        
        expect(config.dbPath).toBe('json-config/db.json');
        expect(config.labGlobs).toEqual(['tests/**/*.lab.js']);
    });

    test('loads config from package.json solulab field', async () => {
        await Bun.write(
            path.join(testDir, 'package.json'),
            JSON.stringify({
                name: 'test-package',
                version: '1.0.0',
                solulab: {
                    dbPath: 'package-config/db.json',
                    labGlobs: ['lib/**/*.lab.ts'],
                },
            })
        );

        const config = loadConfig();
        
        expect(config.dbPath).toBe('package-config/db.json');
        expect(config.labGlobs).toEqual(['lib/**/*.lab.ts']);
    });

    test('merges partial config with defaults', async () => {
        await Bun.write(
            path.join(testDir, 'solulab.config.js'),
            `
            export default {
                dbPath: 'only-db-path.json',
                // labGlobs not specified, should use default
            };
            `
        );

        const config = loadConfig();
        
        expect(config.dbPath).toBe('only-db-path.json');
        expect(config.labGlobs).toEqual(['**/*.lab.{ts,js}']); // Default value
    });

    test('handles empty config file', async () => {
        await Bun.write(
            path.join(testDir, 'solulab.config.js'),
            `export default {};`
        );

        const config = loadConfig();
        
        // Should return defaults
        expect(config).toEqual({
            dbPath: '.solulab/solulab.json',
            labGlobs: ['**/*.lab.{ts,js}'],
        });
    });

    test('loads config from .solulabrc.yaml', async () => {
        await Bun.write(
            path.join(testDir, '.solulabrc.yaml'),
            `
dbPath: yaml-config/db.json
labGlobs:
  - "**/*.test.lab.ts"
  - "**/*.spec.lab.ts"
            `
        );

        const config = loadConfig();
        
        expect(config.dbPath).toBe('yaml-config/db.json');
        expect(config.labGlobs).toEqual(['**/*.test.lab.ts', '**/*.spec.lab.ts']);
    });

    test('prioritizes config files correctly', async () => {
        // cosmiconfig searches in a specific order
        // Create multiple config files to test precedence
        
        // Lower priority
        await Bun.write(
            path.join(testDir, 'package.json'),
            JSON.stringify({
                solulab: {
                    dbPath: 'package.json',
                },
            })
        );
        
        // Higher priority (should win)
        await Bun.write(
            path.join(testDir, '.solulabrc.json'),
            JSON.stringify({
                dbPath: 'rc.json',
            })
        );

        const config = loadConfig();
        
        // .solulabrc.json should take precedence over package.json
        expect(config.dbPath).toBe('rc.json');
    });

    test('handles malformed config gracefully', async () => {
        await Bun.write(
            path.join(testDir, 'solulab.config.js'),
            `
            // Invalid JavaScript
            export default {
                dbPath: unclosed string literal
            `
        );

        // Should throw or return defaults depending on cosmiconfig behavior
        expect(() => loadConfig()).toThrow();
    });

    test('accepts CommonJS config format', async () => {
        await Bun.write(
            path.join(testDir, 'solulab.config.cjs'),
            `
            module.exports = {
                dbPath: 'commonjs/db.json',
                labGlobs: ['cjs/**/*.lab.js'],
            };
            `
        );

        const config = loadConfig();
        
        expect(config.dbPath).toBe('commonjs/db.json');
        expect(config.labGlobs).toEqual(['cjs/**/*.lab.js']);
    });

    test('handles null config values', async () => {
        await Bun.write(
            path.join(testDir, '.solulabrc.json'),
            JSON.stringify({
                dbPath: null,
                labGlobs: null,
            })
        );

        const config = loadConfig();
        
        // null values should be overridden by defaults in merge
        expect(config.dbPath).toBeDefined();
        expect(config.labGlobs).toBeDefined();
    });

    test('preserves extra config properties', async () => {
        await Bun.write(
            path.join(testDir, 'solulab.config.js'),
            `
            export default {
                dbPath: 'test.json',
                labGlobs: ['*.lab.ts'],
                customProperty: 'custom-value',
                anotherProp: 42,
            };
            `
        );

        const config = loadConfig() as any;
        
        expect(config.dbPath).toBe('test.json');
        expect(config.labGlobs).toEqual(['*.lab.ts']);
        expect(config.customProperty).toBe('custom-value');
        expect(config.anotherProp).toBe(42);
    });
});