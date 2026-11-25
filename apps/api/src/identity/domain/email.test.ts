import { describe, expect, it } from 'vitest';
import { Email } from './email.js';
import { InvalidEmailError } from './invalid-email-error.js';

describe('Email', () => {
  it('normalise la casse et les espaces', () => {
    expect(Email.create(' Ada@Example.COM ').getValue()).toBe('ada@example.com');
  });

  it.each(['', 'ada', 'ada@exemple', 'a b@example.com', `${'a'.repeat(250)}@example.com`])(
    'refuse « %s »',
    (value) => {
      expect(() => Email.create(value)).toThrow(InvalidEmailError);
    },
  );
});
