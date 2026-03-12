import { resolve } from 'node:path';
import { importTransactionsCsv } from './finance/importTransactionsCsv.js';
import { importHealthCsv } from './health/importHealthCsv.js';
import { importMoodCsv } from './mood/importMoodCsv.js';
import { applyMigrations } from './shared/migrate.js';
import { openDatabase } from './shared/db.js';
import { importTasksCsv } from './tasks/importTasksCsv.js';
const usage = `
Usage:
  npm run import -- <domain> <file> [--source=name]

Domains:
  tasks
  finance
  health
  mood
`;
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error(usage.trim());
    process.exit(1);
}
const [domain, fileArg, ...rest] = args;
const filePath = resolve(fileArg);
const sourceFlag = rest.find((value) => value.startsWith('--source='));
const sourceName = sourceFlag ? sourceFlag.replace('--source=', '') : 'manual';
const db = openDatabase();
applyMigrations(db);
const handlers = {
    tasks: importTasksCsv,
    finance: importTransactionsCsv,
    health: importHealthCsv,
    mood: importMoodCsv,
};
const handler = handlers[domain];
if (!handler) {
    console.error(`Unsupported domain "${domain}"`);
    console.error(usage.trim());
    process.exit(1);
}
const result = handler(db, filePath, sourceName);
console.log(JSON.stringify({ domain, filePath, sourceName, ...result }, null, 2));
