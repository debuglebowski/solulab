import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { solulabApiPlugin } from './src/app/vite-plugin-solulab-api';

export default defineConfig({
    plugins: [react(), solulabApiPlugin()],
    root: 'src/app',
    build: {
        outDir: '../../dist/ui',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
