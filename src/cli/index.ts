import { Command } from 'commander';
import { loadConfig } from './loadConfig';
import { runLabs } from './runLabs';

const program = new Command();

program.name('solulab').description('CLI for running solulab').version('0.1.0');

program
    .command('run')
    .description('Run all discovered labs')
    .action(async () => {
        const config = loadConfig();
        await runLabs(config);
    });

program.parse();
