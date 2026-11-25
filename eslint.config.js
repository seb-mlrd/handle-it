import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['**/dist/', '**/coverage/', '**/generated/', '.claude/']),
  tseslint.configs.strict,
  {
    rules: {
      'no-console': 'error',
      'no-empty': 'error',
      // Les modules NestJS sont des classes vides portées par leur décorateur.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },
);
