import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import type { HealthResponse } from '@handle-it/contracts';
import { PublicRoute } from '../shared/http/public-route.decorator.js';
import { HealthService } from './health.service.js';

interface StatusResponse {
  status(code: number): unknown;
}

@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  /** Répond 503 si l'API ne peut pas servir de requêtes. */
  @Get()
  @PublicRoute()
  async getHealth(@Res({ passthrough: true }) response: StatusResponse): Promise<HealthResponse> {
    const health = await this.healthService.check();
    if (health.status === 'unavailable') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return health;
  }
}
