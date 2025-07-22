import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
    test: {
        name: 'e2e',
        include: ['tests/e2e/**/*.test.ts'],
        globals: false,
        environment: 'node',
        testTimeout: 30000,
        hookTimeout: 30000,
        poolOptions: {
            threads: {
                singleThread: true,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '../src'),
        },
    },
});
