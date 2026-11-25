import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ENVIRONMENT_FILE = new URL('../../../../.env', import.meta.url);
const API_DIRECTORY = fileURLToPath(new URL('../../', import.meta.url));
const TEST_DATABASE_SUFFIX = '_test';

/** Crée et migre une base dédiée : les tests ne touchent jamais celle de développement. */
export default function prepareTestDatabase(): void {
  if (existsSync(ENVIRONMENT_FILE)) {
    process.loadEnvFile(ENVIRONMENT_FILE);
  }
  const url = new URL(process.env['DATABASE_URL'] ?? '');
  if (!url.pathname.endsWith(TEST_DATABASE_SUFFIX)) {
    url.pathname += TEST_DATABASE_SUFFIX;
  }
  process.env['DATABASE_URL'] = url.href;
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: API_DIRECTORY,
    stdio: 'pipe',
  });
}
