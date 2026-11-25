import { Module } from '@nestjs/common';
import { EnvironmentModule } from './config/environment-module.js';
import { DatabaseModule } from './database/database-module.js';
import { HealthModule } from './health/health-module.js';

@Module({ imports: [EnvironmentModule, DatabaseModule, HealthModule] })
export class AppModule {}
