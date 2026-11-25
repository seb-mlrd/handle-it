import { describe, expect, it } from 'vitest';
import { ErrorResponseMapper } from './error-response-mapper.js';

describe('ErrorResponseMapper', () => {
  it.each([new Error('mot de passe secret'), 'texte', null])(
    "masque l'erreur inattendue %s",
    (error) => {
      expect(new ErrorResponseMapper().map(error)).toEqual({
        status: 500,
        body: { code: 'INTERNAL_ERROR' },
      });
    },
  );
});
