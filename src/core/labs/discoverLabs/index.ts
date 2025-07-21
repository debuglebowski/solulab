import { glob } from 'glob';
import type { LabDefinition } from '../../types';

export async function discoverLabs(
    patterns: string[] = ['**/*.lab.{ts,js}']
): Promise<LabDefinition[]> {
    const definitions: LabDefinition[] = [];

    for (const pattern of patterns) {
        const files = await glob(pattern, {
            ignore: ['**/node_modules/**', '**/dist/**'],
            absolute: true,
        });

        for (const file of files) {
            try {
                // Import the lab file
                const module = await import(file);

                // Look for exports that match the lab naming pattern
                for (const [exportName, exportValue] of Object.entries(module)) {
                    if (
                        exportName.startsWith('lab__') &&
                        exportValue &&
                        typeof exportValue === 'object'
                    ) {
                        const lab = exportValue as { definition?: LabDefinition };

                        // Check if it has a definition property (created by createSolutionLab)
                        if (lab.definition) {
                            definitions.push({
                                ...lab.definition,
                                filePath: file,
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Failed to load lab from ${file}:`, error);
            }
        }
    }

    return definitions;
}
