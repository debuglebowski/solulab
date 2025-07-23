import { Command } from 'commander';
import * as fs from 'node:fs';
import chalk from 'chalk';
import { loadConfig } from './config';
import { runLabs } from './runner';

const config = loadConfig();

const program = new Command();

program.name('solulab').description('CLI for running solulab').version('0.1.0');

program
    .command('run')
    .description('Run all discovered labs')
    .action(async () => {
        await runLabs(config);
    });

program
    .command('reset')
    .description('Reset solulab by removing the database')
    .action(async () => {
        console.log(chalk.yellow('🧹 Resetting Solulab...'));

        const dbPath = '.solulab';

        if (fs.existsSync(dbPath)) {
            fs.rmSync(dbPath, { recursive: true });
            console.log(chalk.green('✓ Removed .solulab directory'));
        } else {
            console.log(chalk.gray('✓ No .solulab directory found'));
        }

        console.log(chalk.green('✨ Reset complete!'));
    });

program.parse();
