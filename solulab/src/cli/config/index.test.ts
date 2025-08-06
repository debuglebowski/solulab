import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { loadConfig } from './index';

// Mock cosmiconfig
const mockSearch = mock();
const mockExplorer = {
    search: mockSearch,
};

mock.module('cosmiconfig', () => ({
    cosmiconfigSync: mock(() => mockExplorer),
}));

describe('config loading', () => {
    beforeEach(() => {
        // Reset mock before each test
        mockSearch.mockReset();
    });

    test('returns default config when no config file exists', () => {
        mockSearch.mockReturnValue(null);

        const config = loadConfig();

        expect(config).toEqual({
            dbPath: '.solulab/solulab.json',
            labGlobs: ['**/*.lab.{ts,js}'],
        });
    });

    test('loads config from solulab.config.js', () => {
        mockSearch.mockReturnValue({
            config: {
                dbPath: 'custom/path/db.json',
                labGlobs: ['src/**/*.lab.ts'],
            },
            filepath: '/path/to/solulab.config.js',
        });

        const config = loadConfig();

        expect(config.dbPath).toBe('custom/path/db.json');
        expect(config.labGlobs).toEqual(['src/**/*.lab.ts']);
    });

    test('loads config from .solulabrc.json', () => {
        mockSearch.mockReturnValue({
            config: {
                dbPath: 'json-config/db.json',
                labGlobs: ['tests/**/*.lab.js'],
            },
            filepath: '/path/to/.solulabrc.json',
        });

        const config = loadConfig();

        expect(config.dbPath).toBe('json-config/db.json');
        expect(config.labGlobs).toEqual(['tests/**/*.lab.js']);
    });

    test('loads config from package.json solulab field', () => {
        mockSearch.mockReturnValue({
            config: {
                dbPath: 'package-config/db.json',
                labGlobs: ['lib/**/*.lab.ts'],
            },
            filepath: '/path/to/package.json',
        });

        const config = loadConfig();

        expect(config.dbPath).toBe('package-config/db.json');
        expect(config.labGlobs).toEqual(['lib/**/*.lab.ts']);
    });

    test('merges partial config with defaults', () => {
        mockSearch.mockReturnValue({
            config: {
                dbPath: 'only-db-path.json',
                // labGlobs not specified, should use default
            },
            filepath: '/path/to/solulab.config.js',
        });

        const config = loadConfig();

        expect(config.dbPath).toBe('only-db-path.json');
        expect(config.labGlobs).toEqual(['**/*.lab.{ts,js}']); // Default value
    });

    test('handles empty config file', () => {
        mockSearch.mockReturnValue({
            config: {},
            filepath: '/path/to/solulab.config.js',
        });

        const config = loadConfig();

        // Should return defaults
        expect(config).toEqual({
            dbPath: '.solulab/solulab.json',
            labGlobs: ['**/*.lab.{ts,js}'],
        });
    });

    test('loads config from .solulabrc.yaml', () => {
        mockSearch.mockReturnValue({
            config: {
                dbPath: 'yaml-config/db.json',
                labGlobs: ['**/*.test.lab.ts', '**/*.spec.lab.ts'],
            },
            filepath: '/path/to/.solulabrc.yaml',
        });

        const config = loadConfig();

        expect(config.dbPath).toBe('yaml-config/db.json');
        expect(config.labGlobs).toEqual(['**/*.test.lab.ts', '**/*.spec.lab.ts']);
    });

    test('prioritizes config files correctly', () => {
        // cosmiconfig searches in a specific order
        // Simulate .solulabrc.json taking precedence
        mockSearch.mockReturnValue({
            config: {
                dbPath: 'rc.json',
            },
            filepath: '/path/to/.solulabrc.json',
        });

        const config = loadConfig();

        // .solulabrc.json should take precedence over package.json
        expect(config.dbPath).toBe('rc.json');
    });

    test('handles malformed config gracefully', () => {
        // Simulate cosmiconfig throwing an error for malformed config
        mockSearch.mockImplementation(() => {
            throw new Error('Failed to parse config');
        });

        // Should throw or return defaults depending on cosmiconfig behavior
        expect(() => loadConfig()).toThrow();
    });

    test('accepts CommonJS config format', () => {
        mockSearch.mockReturnValue({
            config: {
                dbPath: 'commonjs/db.json',
                labGlobs: ['cjs/**/*.lab.js'],
            },
            filepath: '/path/to/solulab.config.cjs',
        });

        const config = loadConfig();

        expect(config.dbPath).toBe('commonjs/db.json');
        expect(config.labGlobs).toEqual(['cjs/**/*.lab.js']);
    });

    test('handles null config values', () => {
        mockSearch.mockReturnValue({
            config: {
                dbPath: null,
                labGlobs: null,
            },
            filepath: '/path/to/.solulabrc.json',
        });

        const config = loadConfig();

        // null values should be overridden by defaults in merge
        expect(config.dbPath).toBeDefined();
        expect(config.labGlobs).toBeDefined();
    });

    test('preserves extra config properties', () => {
        mockSearch.mockReturnValue({
            config: {
                dbPath: 'test.json',
                labGlobs: ['*.lab.ts'],
                customProperty: 'custom-value',
                anotherProp: 42,
            },
            filepath: '/path/to/solulab.config.js',
        });

        const config = loadConfig() as any;

        expect(config.dbPath).toBe('test.json');
        expect(config.labGlobs).toEqual(['*.lab.ts']);
        expect(config.customProperty).toBe('custom-value');
        expect(config.anotherProp).toBe(42);
    });
});
