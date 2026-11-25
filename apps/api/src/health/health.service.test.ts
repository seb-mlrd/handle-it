import { describe, expect, it } from 'vitest';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it.each([
    [true, 'ok'],
    [false, 'unavailable'],
  ])('base joignable : %s, état : %s', async (isReachable, status) => {
    const healthService = new HealthService({ isReachable: async () => isReachable });
    expect(await healthService.check()).toEqual({ status });
  });
});
