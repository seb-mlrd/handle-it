import { Module } from '@nestjs/common';
import { BoardModule } from './board/board.module.js';
import { ColumnModule } from './column/column.module.js';
import { EnvironmentModule } from './config/environment.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HttpModule } from './shared/http/http.module.js';

@Module({
  imports: [
    EnvironmentModule,
    DatabaseModule,
    HttpModule,
    AuthModule,
    BoardModule,
    ColumnModule,
    HealthModule,
  ],
})
export class AppModule {}
