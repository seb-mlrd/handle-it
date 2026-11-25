import type { HealthResponse } from '@handle-it/contracts';
import type { DatabaseProbe } from './database-probe.js';

/** Détermine si l'API peut servir des requêtes. */
export class HealthService {
  constructor(private readonly databaseProbe: DatabaseProbe) {}

  async check(): Promise<HealthResponse> {
    const isReachable = await this.databaseProbe.isReachable();
    return { status: isReachable ? 'ok' : 'unavailable' };
  }
}
