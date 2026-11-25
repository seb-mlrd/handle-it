import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './health-response.js';

describe('healthResponseSchema', () => {
  it('accepte un état connu', () => {
    expect(healthResponseSchema.parse({ status: 'ok' })).toEqual({ status: 'ok' });
  });

  it('refuse un état inconnu', () => {
    expect(healthResponseSchema.safeParse({ status: 'peut-être' }).success).toBe(false);
  });
});
