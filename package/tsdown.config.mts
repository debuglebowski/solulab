import { defineConfig } from 'tsdown/config';

export default defineConfig({
	dts: true,
	sourcemap: true,

	entry: [
		'./src/ui/index.tsx',
		'./src/storage/index.mts',
		'./src/engine/index.mts',
		'./src/cli/index.mts',
	],

	external: ['react', 'react-dom', 'react-server-dom-webpack', 'waku'],
});
