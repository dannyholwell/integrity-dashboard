import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
const envSchema = z.object({
    HOST: z.string().default('127.0.0.1'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_PATH: z.string().optional(),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});
const projectRoot = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
export const env = (() => {
    const parsed = envSchema.parse(process.env);
    return {
        host: parsed.HOST,
        port: parsed.PORT,
        logLevel: parsed.LOG_LEVEL,
        projectRoot,
        databasePath: parsed.DATABASE_PATH ? resolve(parsed.DATABASE_PATH) : resolve(projectRoot, 'data', 'integrity-dashboard.sqlite'),
    };
})();
