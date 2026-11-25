import { Global, Module } from '@nestjs/common';
import { Sha256TokenService } from './security/sha256-token.service.js';
import { TokenService } from './security/token.service.js';
import { Clock } from './time/clock.js';
import { SystemClock } from './time/system-clock.js';

/** Outils techniques communs à plusieurs domaines. */
@Global()
@Module({
  providers: [
    { provide: Clock, useClass: SystemClock },
    { provide: TokenService, useClass: Sha256TokenService },
  ],
  exports: [Clock, TokenService],
})
export class SharedModule {}
