import { describe, expect, it } from 'vitest';
import { DueDate } from './due-date.value-object.js';
import { InvalidDueDateError } from './errors/invalid-due-date.error.js';

describe('DueDate', () => {
  it('fait l’aller-retour avec la base sans changer de jour', () => {
    const dueOn = DueDate.fromValue('2026-12-31');
    expect(DueDate.fromDatabase(dueOn.toDatabase()).getValue()).toBe('2026-12-31');
  });

  it.each(['2026-02-30', '2026-13-01', '26-01-01', 'demain'])('refuse %s', (value) => {
    expect(() => DueDate.fromValue(value)).toThrow(InvalidDueDateError);
  });

  it('accepte le 29 février d’une année bissextile', () => {
    expect(DueDate.fromValue('2028-02-29').getValue()).toBe('2028-02-29');
  });
});
