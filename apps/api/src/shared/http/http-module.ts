import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ErrorFilter } from './error-filter.js';
import { OriginGuard } from './origin-guard.js';

@Module({
  providers: [
    { provide: APP_FILTER, useClass: ErrorFilter },
    { provide: APP_GUARD, useClass: OriginGuard },
  ],
})
export class HttpModule {}
