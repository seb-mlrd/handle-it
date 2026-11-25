import { Module } from '@nestjs/common';
import { HealthService } from './health.service.js';
import { DatabaseProbe } from './database-probe.js';
import { PrismaDatabaseProbe } from './prisma-database-probe.js';
import { HealthController } from './health.controller.js';

@Module({
  controllers: [HealthController],
  providers: [
    { provide: DatabaseProbe, useClass: PrismaDatabaseProbe },
    {
      provide: HealthService,
      useFactory: (databaseProbe: DatabaseProbe) => new HealthService(databaseProbe),
      inject: [DatabaseProbe],
    },
  ],
})
export class HealthModule {}
