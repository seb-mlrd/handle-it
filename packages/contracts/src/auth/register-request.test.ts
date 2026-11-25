import { describe, expect, it } from 'vitest';
import { registerRequestSchema } from './register-request.js';

const VALID_REQUEST = {
  email: 'ada@example.com',
  displayName: 'Ada',
  password: 'mot-de-passe-long',
};

describe('registerRequestSchema', () => {
  it("normalise l'e-mail et le nom sans toucher au mot de passe", () => {
    const request = {
      email: ' Ada@Example.com ',
      displayName: ' Ada ',
      password: '  douze-caracteres  ',
    };
    expect(registerRequestSchema.parse(request)).toEqual({
      email: 'ada@example.com',
      displayName: 'Ada',
      password: '  douze-caracteres  ',
    });
  });

  it.each([
    ['email', 'pas-un-email'],
    ['displayName', '   '],
    ['displayName', 'a'.repeat(51)],
    ['password', 'trop-court'],
    ['password', 'a'.repeat(129)],
  ])('refuse %s = %s', (field, value) => {
    const result = registerRequestSchema.safeParse({ ...VALID_REQUEST, [field]: value });
    expect(result.error?.issues[0]?.path).toEqual([field]);
  });
});
