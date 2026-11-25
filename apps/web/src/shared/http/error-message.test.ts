import { describe, expect, it } from 'vitest';
import { ApiError } from './api-error';
import { getErrorMessage } from './error-message';

describe('getErrorMessage', () => {
  it('traduit un code connu', () => {
    expect(getErrorMessage(new ApiError('TOO_MANY_REQUESTS'))).toMatch(/^Trop de tentatives/);
  });

  it.each([new ApiError('INTERNAL_ERROR'), new Error('détail interne'), null])(
    'reste générique pour %s',
    (error) => {
      expect(getErrorMessage(error)).toBe('Une erreur est survenue. Réessaie dans un instant.');
    },
  );
});
