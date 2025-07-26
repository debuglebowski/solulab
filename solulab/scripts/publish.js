#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { program } from 'commander';
import { execa } from 'execa';
import { password } from '@inquirer/prompts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, '..', 'package.json');



async function runCommand(command, description, dryRun = false) {
    console.log(chalk.cyan(`\n${description}...`));
    
    if (dryRun) {
        console.log(chalk.yellow(`[DRY RUN] Would execute: ${command}`));
        return { stdout: '[dry run output]', stderr: '' };
    }
    
    try {
        const result = await execa(command, { shell: true });
        console.log(chalk.green(`✓ ${description} completed`));
        return result;
    } catch (error) {
        console.log(chalk.red(`✗ ${description} failed`));
        throw error;
    }
}

async function checkPrerequisites() {
    console.log(chalk.bold('\nChecking prerequisites...'));
    
    // Check if we're in the right directory
    try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
        if (pkg.name !== 'solulab') {
            throw new Error('Not in solulab package directory');
        }
        console.log(chalk.green(`✓ Found package: ${pkg.name}@${pkg.version}`));
    } catch (error) {
        console.log(chalk.red('✗ Could not find solulab package.json'));
        throw error;
    }
    
    // Check git status
    try {
        const { stdout } = await execa('git', ['status', '--porcelain']);
        if (stdout.trim()) {
            console.log(chalk.red('✗ Git working directory not clean'));
            console.log(chalk.yellow('  Uncommitted changes:'));
            console.log(stdout);
            throw new Error('Please commit or stash your changes first');
        }
        console.log(chalk.green('✓ Git working directory clean'));
    } catch (error) {
        if (error.message.includes('not a git repository')) {
            console.log(chalk.yellow('⚠ Not a git repository (continuing anyway)'));
        } else {
            throw error;
        }
    }
    
    // Check if on main/master branch
    try {
        const { stdout } = await execa('git', ['branch', '--show-current']);
        const branch = stdout.trim();
        if (branch !== 'main' && branch !== 'master') {
            console.log(chalk.yellow(`⚠ Not on main branch (current: ${branch})`));
            console.log(chalk.yellow('  Consider switching to main branch before publishing'));
        } else {
            console.log(chalk.green(`✓ On ${branch} branch`));
        }
    } catch (error) {
        // Ignore git errors
    }
}

async function publish(options = {}) {
    let { dryRun = true, version, tag = 'latest', otp } = options;
    
    console.log(chalk.bold('\nSolulab NPM Publishing Script'));
    console.log(dryRun ? chalk.yellow(`Mode: DRY RUN`) : chalk.red(`Mode: LIVE PUBLISH`));
    
    try {
        // Run prerequisites check
        await checkPrerequisites();
        
        // Run tests
        await runCommand('bun test', 'Running tests', dryRun);
        
        // Run typecheck
        await runCommand('bun run typecheck', 'Type checking', dryRun);
        
        // Build the package
        await runCommand('bun run build', 'Building package', dryRun);
        
        // Bump version if specified
        if (version) {
            await runCommand(`npm version ${version}`, `Bumping version to ${version}`, dryRun);
        }
        
        // Get current version
        const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
        console.log(chalk.bold(`\nPublishing ${pkg.name}@${pkg.version} with tag '${tag}'`));
        
        // Prompt for OTP if not provided and not in dry run
        if (!dryRun && !otp) {
            console.log(chalk.yellow('\nℹ NPM requires a one-time password from your authenticator.'));
            otp = await password({
                message: 'Enter OTP code:',
                mask: '•'
            });
            if (!otp) {
                throw new Error('OTP code is required for publishing');
            }
        }
        
        // Run npm publish
        const publishCmd = `npm publish --tag ${tag} ${dryRun ? '--dry-run' : ''} ${otp ? `--otp=${otp}` : ''}`;
        await runCommand(publishCmd, 'Publishing to npm', false);
        
        if (!dryRun) {
            console.log(chalk.green('\n✓ Package published successfully!'));
            console.log(chalk.cyan(`  View at: https://www.npmjs.com/package/${pkg.name}`));
        } else {
            console.log(chalk.green('\n✓ Dry run completed successfully!'));
            console.log(chalk.yellow('  To publish for real, run:'));
            console.log(chalk.yellow('  npm run release:dry -- --no-dry-run'));
        }
        
    } catch (error) {
        console.log(chalk.red(`\n✗ Publishing failed: ${error.message}`));
        
        // Check if error is due to missing OTP
        if (error.message.includes('OTP') || error.message.includes('one-time password')) {
            console.log(chalk.yellow('\nℹ NPM requires a one-time password from your authenticator.'));
            console.log(chalk.yellow('  Please run again with --otp=<code> parameter:'));
            console.log(chalk.cyan(`  npm run publish:patch -- --otp=123456`));
        }
        
        process.exit(1);
    }
}

// Setup command line interface
program
    .name('publish')
    .description('Solulab NPM Publishing Script')
    .option('--no-dry-run', 'Actually publish (default is dry run)')
    .option('--version <type>', 'Bump version before publishing (patch|minor|major)')
    .option('--tag <tag>', 'NPM dist-tag', 'latest')
    .option('--otp <code>', 'One-time password from your authenticator')
    .addHelpText('after', `
Examples:
  # Dry run (default)
  node scripts/publish.js
  
  # Publish patch version
  node scripts/publish.js --version patch --no-dry-run
  
  # Publish with custom tag
  node scripts/publish.js --tag beta --no-dry-run
  
  # Publish with OTP
  node scripts/publish.js --version patch --no-dry-run --otp 123456`);

// Parse arguments
program.parse();
const options = program.opts();

// Run the publish process
publish(options);