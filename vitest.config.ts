import { defineConfig } from 'vitest/config';

const INTEGRATION_TESTS = 'apps/api/src/**/*.integration.test.ts';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['{apps,packages}/*/src/**/*.test.ts'],
          exclude: [INTEGRATION_TESTS],
        },
      },
      {
        test: {
          name: 'integration',
          include: [INTEGRATION_TESTS],
          globalSetup: ['apps/api/src/testing/prepare-test-database.ts'],
          // Les fichiers partagent une même base : ils s'exécutent l'un après l'autre.
          fileParallelism: false,
        },
      },
    ],
  },
});
