import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const ENVIRONMENT_FILE = fileURLToPath(new URL('../../.env', import.meta.url));
const API_PORT = 3101;
const WEB_PORT = 5273;
const WEB_ORIGIN = `http://localhost:${WEB_PORT}`;
const E2E_DATABASE_SUFFIX = '_e2e';

if (existsSync(ENVIRONMENT_FILE)) {
  process.loadEnvFile(ENVIRONMENT_FILE);
}

// Base dédiée : les parcours ne touchent jamais celle de développement.
const databaseUrl = new URL(process.env['DATABASE_URL'] ?? '');
databaseUrl.pathname += E2E_DATABASE_SUFFIX;

// En local, le mode développement révèle les défauts que seul StrictMode provoque ;
// la CI vérifie la version construite, celle qui sera mise en ligne.
const WEB_COMMAND = process.env['CI']
  ? `pnpm run build && pnpm exec vite preview --port ${WEB_PORT}`
  : `pnpm exec vite --port ${WEB_PORT}`;

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  forbidOnly: Boolean(process.env['CI']),
  use: { baseURL: WEB_ORIGIN, locale: 'fr-FR', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm run build && pnpm exec prisma migrate deploy && node dist/main.js',
      cwd: '../api',
      url: `http://localhost:${API_PORT}/api/health`,
      env: {
        DATABASE_URL: databaseUrl.href,
        PORT: String(API_PORT),
        WEB_ORIGIN,
        AUTH_ATTEMPTS_LIMIT: '1000',
      },
    },
    {
      command: WEB_COMMAND,
      url: WEB_ORIGIN,
      env: {
        API_URL: `http://localhost:${API_PORT}`,
        VITE_CACHE_DIRECTORY: 'node_modules/.vite-e2e',
      },
    },
  ],
});
