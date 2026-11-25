import { describe, expect, it } from 'vitest';
import { Session } from './session.entity.js';

const EXPIRES_AT = new Date('2026-01-01T00:00:00.000Z');

describe('Session', () => {
  it.each([
    ['2025-12-31T23:59:59.999Z', false],
    ['2026-01-01T00:00:00.000Z', true],
  ])('à %s, expirée : %s', (now, isExpired) => {
    const session = new Session('utilisateur', 'empreinte', EXPIRES_AT);
    expect(session.isExpired(new Date(now))).toBe(isExpired);
  });
});
