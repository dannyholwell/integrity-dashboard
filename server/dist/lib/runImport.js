import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const parseImportOutput = (output) => {
    const trimmed = output.trim();
    if (!trimmed) {
        throw new Error('Import finished without output');
    }
    return JSON.parse(trimmed);
};
export const createImportRunner = ({ databasePath, projectRoot }) => {
    const ingestRoot = resolve(projectRoot, 'ingest');
    const tsxBinary = resolve(ingestRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
    const distCli = resolve(ingestRoot, 'dist', 'cli.js');
    const command = existsSync(tsxBinary) ? tsxBinary : process.execPath;
    const baseArgs = existsSync(tsxBinary) ? ['src/cli.ts'] : [distCli];
    return ({ domain, filePath, sourceName }) => new Promise((resolvePromise, rejectPromise) => {
        const child = spawn(command, [...baseArgs, domain, filePath, `--source=${sourceName}`], {
            cwd: ingestRoot,
            env: {
                ...process.env,
                DATABASE_PATH: databasePath,
            },
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk) => {
            stdout += String(chunk);
        });
        child.stderr.on('data', (chunk) => {
            stderr += String(chunk);
        });
        child.on('error', (error) => {
            rejectPromise(error);
        });
        child.on('close', (code) => {
            if (code !== 0) {
                rejectPromise(new Error(stderr.trim() || stdout.trim() || `Import failed with exit code ${code}`));
                return;
            }
            try {
                resolvePromise(parseImportOutput(stdout));
            }
            catch (error) {
                rejectPromise(error);
            }
        });
    });
};
