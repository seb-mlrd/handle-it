import { groupFieldErrors } from '@handle-it/contracts';
import { describe, expect, it } from 'vitest';
import { registerFormSchema } from './register-form-schema';

const REQUEST = { email: 'ada@example.com', displayName: 'Ada', password: 'mot-de-passe-long' };

const readErrors = (form: unknown) => {
  const { error } = registerFormSchema.safeParse(form);
  return error ? groupFieldErrors(error) : {};
};

describe('registerFormSchema', () => {
  it("ne garde que les champs attendus par l'API", () => {
    const form = { ...REQUEST, passwordConfirmation: REQUEST.password };
    expect(registerFormSchema.parse(form)).toEqual(REQUEST);
  });

  it('refuse une confirmation différente', () => {
    expect(readErrors({ ...REQUEST, passwordConfirmation: 'autre' })).toEqual({
      passwordConfirmation: ['Les mots de passe ne correspondent pas'],
    });
  });

  it('signale la différence même si un autre champ est invalide', () => {
    const form = { ...REQUEST, email: 'faux', passwordConfirmation: 'autre' };
    expect(Object.keys(readErrors(form)).sort()).toEqual(['email', 'passwordConfirmation']);
  });
});
