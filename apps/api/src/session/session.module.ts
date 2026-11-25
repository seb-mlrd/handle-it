import { Module } from '@nestjs/common';
import { Clock } from '../shared/time/clock.js';
import { SystemClock } from '../shared/time/system-clock.js';
import { PrismaSessionRepository } from './prisma-session.repository.js';
import { SessionRepository } from './session.repository.js';
import { SessionService } from './session.service.js';
import { SessionTokenService } from './session-token.service.js';
import { Sha256SessionTokenService } from './sha256-session-token.service.js';

@Module({
  providers: [
    { provide: SessionRepository, useClass: PrismaSessionRepository },
    { provide: SessionTokenService, useClass: Sha256SessionTokenService },
    { provide: Clock, useClass: SystemClock },
    {
      provide: SessionService,
      useFactory: (...dependencies: ConstructorParameters<typeof SessionService>) =>
        new SessionService(...dependencies),
      inject: [SessionRepository, SessionTokenService, Clock],
    },
  ],
  exports: [SessionService],
})
export class SessionModule {}
