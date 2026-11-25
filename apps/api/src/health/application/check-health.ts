import type { HealthResponse } from '@handle-it/contracts';
import type { DatabaseProbe } from './database-probe.js';

/** Cas d'usage : déterminer si l'API peut servir des requêtes. */
export class CheckHealth {
  constructor(private readonly databaseProbe: DatabaseProbe) {}

  async execute(): Promise<HealthResponse> {
    const isReachable = await this.databaseProbe.isReachable();
    return { status: isReachable ? 'ok' : 'unavailable' };
  }
}
