import { Command } from 'commander';
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

program.parse();
