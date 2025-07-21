import { pathToFileURL } from 'node:url';
import chalk from 'chalk';
import type { LabResult } from '@/core';
import { discoverLabs, database } from '@/core';
import type { SolutionLabsConfig } from '../loadConfig';

export async function runLabs(config: SolutionLabsConfig) {
    const startTime = Date.now();

    try {
        console.log(chalk.gray('Discovering labs...'));
        const definitions = await discoverLabs(config.labGlobs || ['**/*.lab.{ts,js}']);

        if (definitions.length === 0) {
            console.log(chalk.yellow('No labs found'));

            return;
        }

        console.log(chalk.gray(`Found ${definitions.length} labs`));

        let totalExecutions = 0;
        let skippedExecutions = 0;
        let successCount = 0;
        let failureCount = 0;

        for (const definition of definitions) {
            try {
                const fileUrl = pathToFileURL(definition.filePath).href;
                const module = await import(fileUrl);

                // Find the lab export
                const labExport = Object.entries(module).find(([key]) => key.startsWith('lab__'));

                if (!labExport) {
                    console.error(chalk.red(`No lab export found in ${definition.filePath}`));
                    continue;
                }

                const lab = labExport[1] as {
                    execute: (
                        versionName: string,
                        caseName: string
                    ) => Promise<LabResult<unknown, unknown>>;
                };

                const labId = await database.getOrCreateLab(
                    definition.name,
                    definition.description,
                    definition.paramSchema,
                    definition.resultSchema
                );

                console.log(chalk.blue(`\nRunning lab: ${definition.name}`));
                console.log(chalk.gray(`  Versions: ${definition.versions.length}`));
                console.log(chalk.gray(`  Cases: ${definition.cases.length}`));

                // Execute all version × case combinations
                for (const versionName of definition.versions) {
                    for (const caseName of definition.cases) {
                        totalExecutions++;

                        // Check if this combination has already been run
                        if (await database.hasResult(labId, versionName, caseName)) {
                            skippedExecutions++;
                            console.log(
                                chalk.gray(
                                    `  ⏭️  Skipping ${versionName} × ${caseName} (already exists)`
                                )
                            );
                            continue;
                        }

                        console.log(chalk.gray(`  ▶️  Running ${versionName} × ${caseName}...`));

                        try {
                            const result = await lab.execute(versionName, caseName);
                            await database.saveResult(labId, result);

                            if (result.error) {
                                failureCount++;
                                console.log(
                                    chalk.red(
                                        `  ❌ ${versionName} × ${caseName} failed: ${result.error}`
                                    )
                                );
                            } else {
                                successCount++;
                                console.log(
                                    chalk.green(
                                        `  ✅ ${versionName} × ${caseName} (${result.duration}ms)`
                                    )
                                );
                            }
                        } catch (error) {
                            failureCount++;
                            console.log(
                                chalk.red(`  ❌ ${versionName} × ${caseName} threw:`, error)
                            );
                        }
                    }
                }
            } catch (error) {
                console.error(chalk.red(`Failed to run lab from ${definition.filePath}:`), error);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const executedCount = totalExecutions - skippedExecutions;

        console.log(chalk.gray(`\n${'─'.repeat(50)}`));
        console.log(chalk.gray(`Total combinations: ${totalExecutions}`));
        console.log(chalk.gray(`Skipped (existing): ${skippedExecutions}`));
        console.log(chalk.gray(`Executed: ${executedCount}`));

        if (executedCount > 0) {
            if (failureCount === 0) {
                console.log(
                    chalk.green(`✅ All ${successCount} executions succeeded (${duration}s)`)
                );
                process.exit(0);
            } else {
                console.log(
                    chalk.red(`❌ ${failureCount} failed, ${successCount} succeeded (${duration}s)`)
                );
                process.exit(1);
            }
        } else {
            console.log(chalk.gray(`No new executions needed (${duration}s)`));
            process.exit(0);
        }
    } catch (error) {
        console.error(chalk.red('Fatal error:'), error);
        process.exit(1);
    } finally {
        database.close();
    }
}
