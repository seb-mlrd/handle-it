import { Module } from '@nestjs/common';
import { EnvironmentModule } from './config/environment-module.js';
import { DatabaseModule } from './database/database-module.js';
import { HealthModule } from './health/health-module.js';
import { IdentityModule } from './identity/identity-module.js';
import { HttpModule } from './shared/http/http-module.js';

@Module({
  imports: [EnvironmentModule, DatabaseModule, HttpModule, IdentityModule, HealthModule],
})
export class AppModule {}
