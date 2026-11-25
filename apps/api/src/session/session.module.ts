import { Module } from '@nestjs/common';
import { TokenService } from '../shared/security/token.service.js';
import { Clock } from '../shared/time/clock.js';
import { PrismaSessionRepository } from './prisma-session.repository.js';
import { SessionRepository } from './session.repository.js';
import { SessionService } from './session.service.js';

@Module({
  providers: [
    { provide: SessionRepository, useClass: PrismaSessionRepository },
    {
      provide: SessionService,
      useFactory: (...dependencies: ConstructorParameters<typeof SessionService>) =>
        new SessionService(...dependencies),
      inject: [SessionRepository, TokenService, Clock],
    },
  ],
  exports: [SessionService],
})
export class SessionModule {}
