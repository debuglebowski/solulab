import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        'cli/index': 'src/cli/index.ts',
    },
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    shims: true,
    external: [
        'vite',
        'react',
        'react-dom',
        'react-router-dom',
        '@radix-ui/react-select',
        'tailwindcss',
        'diff',
        'clsx',
        '@vitejs/plugin-react',
        'autoprefixer',
        'postcss',
    ],
    esbuildOptions(options) {
        options.alias = {
            '@': './src',
        };
    },
});
