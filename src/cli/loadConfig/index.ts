import { cosmiconfigSync } from 'cosmiconfig';

export interface SolutionLabsConfig {
    dbPath?: string;
    labGlobs?: string[];
}

const defaultConfig: SolutionLabsConfig = {
    dbPath: '.solulab/solulab.json',
    labGlobs: ['**/*.lab.{ts,js}'],
};

export function loadConfig(): SolutionLabsConfig {
    const explorer = cosmiconfigSync('solulab');
    const result = explorer.search();

    if (result?.config) {
        return {
            ...defaultConfig,
            ...result.config,
        };
    }

    return defaultConfig;
}
