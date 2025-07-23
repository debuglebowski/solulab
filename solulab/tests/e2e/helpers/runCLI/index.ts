import { spawn } from 'node:child_process';
import path from 'node:path';

export interface CLIResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}

export async function runCLI(cwd: string, args: string[] = ['run']): Promise<CLIResult> {
    return new Promise((resolve) => {
        const cliPath = path.join(process.cwd(), 'dist/cli/index.js');
        const child = spawn('bun', [cliPath, ...args], {
            cwd,
            env: { ...process.env, NODE_ENV: 'test' },
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (exitCode) => {
            resolve({
                exitCode: exitCode ?? 0,
                stdout,
                stderr,
            });
        });
    });
}
