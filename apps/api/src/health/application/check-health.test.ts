import { describe, expect, it } from 'vitest';
import { CheckHealth } from './check-health.js';

describe('CheckHealth', () => {
  it.each([
    [true, 'ok'],
    [false, 'unavailable'],
  ])('base joignable : %s, état : %s', async (isReachable, status) => {
    const checkHealth = new CheckHealth({ isReachable: async () => isReachable });
    expect(await checkHealth.execute()).toEqual({ status });
  });
});
