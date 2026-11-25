import { Module } from '@nestjs/common';
import { CheckHealth } from './application/check-health.js';
import { DatabaseProbe } from './application/database-probe.js';
import { PrismaDatabaseProbe } from './infrastructure/prisma-database-probe.js';
import { HealthController } from './presentation/health-controller.js';

@Module({
  controllers: [HealthController],
  providers: [
    { provide: DatabaseProbe, useClass: PrismaDatabaseProbe },
    {
      provide: CheckHealth,
      useFactory: (databaseProbe: DatabaseProbe) => new CheckHealth(databaseProbe),
      inject: [DatabaseProbe],
    },
  ],
})
export class HealthModule {}
