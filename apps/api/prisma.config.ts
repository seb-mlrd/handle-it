import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

const ENVIRONMENT_FILE = new URL('../../.env', import.meta.url);
if (existsSync(ENVIRONMENT_FILE)) {
  process.loadEnvFile(ENVIRONMENT_FILE);
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // La génération du client n'a pas besoin de base : l'URL peut être absente en CI.
  datasource: { url: process.env['DATABASE_URL'] ?? '' },
});
