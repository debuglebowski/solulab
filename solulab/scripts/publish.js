#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, '..', 'package.json');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

async function runCommand(command, description, dryRun = false) {
    log(`\n${description}...`, colors.cyan);
    
    if (dryRun) {
        log(`[DRY RUN] Would execute: ${command}`, colors.yellow);
        return { stdout: '[dry run output]', stderr: '' };
    }
    
    try {
        const result = await execAsync(command);
        log(`✓ ${description} completed`, colors.green);
        return result;
    } catch (error) {
        log(`✗ ${description} failed`, colors.red);
        throw error;
    }
}

async function checkPrerequisites() {
    log('\nChecking prerequisites...', colors.bright);
    
    // Check if we're in the right directory
    try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
        if (pkg.name !== 'solulab') {
            throw new Error('Not in solulab package directory');
        }
        log(`✓ Found package: ${pkg.name}@${pkg.version}`, colors.green);
    } catch (error) {
        log('✗ Could not find solulab package.json', colors.red);
        throw error;
    }
    
    // Check git status
    try {
        const { stdout } = await execAsync('git status --porcelain');
        if (stdout.trim()) {
            log('✗ Git working directory not clean', colors.red);
            log('  Uncommitted changes:', colors.yellow);
            console.log(stdout);
            throw new Error('Please commit or stash your changes first');
        }
        log('✓ Git working directory clean', colors.green);
    } catch (error) {
        if (error.message.includes('not a git repository')) {
            log('⚠ Not a git repository (continuing anyway)', colors.yellow);
        } else {
            throw error;
        }
    }
    
    // Check if on main/master branch
    try {
        const { stdout } = await execAsync('git branch --show-current');
        const branch = stdout.trim();
        if (branch !== 'main' && branch !== 'master') {
            log(`⚠ Not on main branch (current: ${branch})`, colors.yellow);
            log('  Consider switching to main branch before publishing', colors.yellow);
        } else {
            log(`✓ On ${branch} branch`, colors.green);
        }
    } catch (error) {
        // Ignore git errors
    }
}

async function publish(options = {}) {
    const { dryRun = true, version, tag = 'latest', otp } = options;
    
    log(`\n${colors.bright}Solulab NPM Publishing Script${colors.reset}`);
    log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE PUBLISH'}`, dryRun ? colors.yellow : colors.red);
    
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
        log(`\nPublishing ${pkg.name}@${pkg.version} with tag '${tag}'`, colors.bright);
        
        // Run npm publish
        const publishCmd = `npm publish --tag ${tag} ${dryRun ? '--dry-run' : ''} ${otp ? `--otp=${otp}` : ''}`;
        await runCommand(publishCmd, 'Publishing to npm', false);
        
        if (!dryRun) {
            log('\n✓ Package published successfully!', colors.green);
            log(`  View at: https://www.npmjs.com/package/${pkg.name}`, colors.cyan);
        } else {
            log('\n✓ Dry run completed successfully!', colors.green);
            log('  To publish for real, run:', colors.yellow);
            log('  npm run release:dry -- --no-dry-run', colors.yellow);
        }
        
    } catch (error) {
        log(`\n✗ Publishing failed: ${error.message}`, colors.red);
        
        // Check if error is due to missing OTP
        if (error.message.includes('OTP') || error.message.includes('one-time password')) {
            log('\nℹ NPM requires a one-time password from your authenticator.', colors.yellow);
            log('  Please run again with --otp=<code> parameter:', colors.yellow);
            log(`  npm run publish:patch -- --otp=123456`, colors.cyan);
        }
        
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    dryRun: !args.includes('--no-dry-run'),
    version: args.find(arg => arg.startsWith('--version='))?.split('=')[1],
    tag: args.find(arg => arg.startsWith('--tag='))?.split('=')[1] || 'latest',
    otp: args.find(arg => arg.startsWith('--otp='))?.split('=')[1]
};

if (args.includes('--help')) {
    console.log(`
Solulab NPM Publishing Script

Usage: node scripts/publish.js [options]

Options:
  --no-dry-run     Actually publish (default is dry run)
  --version=TYPE   Bump version before publishing (patch|minor|major)
  --tag=TAG        NPM dist-tag (default: latest)
  --otp=CODE       One-time password from your authenticator
  --help           Show this help message

Examples:
  # Dry run (default)
  node scripts/publish.js
  
  # Publish patch version
  node scripts/publish.js --version=patch --no-dry-run
  
  # Publish with custom tag
  node scripts/publish.js --tag=beta --no-dry-run
  
  # Publish with OTP
  node scripts/publish.js --version=patch --no-dry-run --otp=123456
`);
    process.exit(0);
}

// Run the publish process
publish(options);