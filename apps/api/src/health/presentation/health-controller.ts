import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import type { HealthResponse } from '@handle-it/contracts';
import { CheckHealth } from '../application/check-health.js';

interface StatusResponse {
  status(code: number): unknown;
}

@Controller('health')
export class HealthController {
  constructor(@Inject(CheckHealth) private readonly checkHealth: CheckHealth) {}

  /** Répond 503 si l'API ne peut pas servir de requêtes. */
  @Get()
  async getHealth(@Res({ passthrough: true }) response: StatusResponse): Promise<HealthResponse> {
    const health = await this.checkHealth.execute();
    if (health.status === 'unavailable') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return health;
  }
}
