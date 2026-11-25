import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { Clock } from './application/clock.js';
import { GetCurrentUser } from './application/get-current-user.js';
import { LogIn } from './application/log-in.js';
import { LogOut } from './application/log-out.js';
import { PasswordHasher } from './application/password-hasher.js';
import { RegisterUser } from './application/register-user.js';
import { SessionOpener } from './application/session-opener.js';
import { SessionRepository } from './application/session-repository.js';
import { SessionTokenService } from './application/session-token-service.js';
import { UserRepository } from './application/user-repository.js';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher.js';
import { PrismaSessionRepository } from './infrastructure/prisma-session-repository.js';
import { PrismaUserRepository } from './infrastructure/prisma-user-repository.js';
import { Sha256SessionTokenService } from './infrastructure/sha256-session-token-service.js';
import { SystemClock } from './infrastructure/system-clock.js';
import { AuthenticationController } from './presentation/authentication-controller.js';
import { AuthenticationGuard } from './presentation/authentication-guard.js';
import { SessionCookie } from './presentation/session-cookie.js';

const MAX_ATTEMPTS = 10;
const ATTEMPTS_WINDOW_MILLISECONDS = 15 * 60 * 1000;

@Module({
  imports: [ThrottlerModule.forRoot([{ limit: MAX_ATTEMPTS, ttl: ATTEMPTS_WINDOW_MILLISECONDS }])],
  controllers: [AuthenticationController],
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: SessionRepository, useClass: PrismaSessionRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    { provide: SessionTokenService, useClass: Sha256SessionTokenService },
    { provide: Clock, useClass: SystemClock },
    {
      provide: SessionOpener,
      useFactory: (...dependencies: ConstructorParameters<typeof SessionOpener>) =>
        new SessionOpener(...dependencies),
      inject: [SessionRepository, SessionTokenService, Clock],
    },
    {
      provide: RegisterUser,
      useFactory: (...dependencies: ConstructorParameters<typeof RegisterUser>) =>
        new RegisterUser(...dependencies),
      inject: [UserRepository, PasswordHasher, SessionOpener],
    },
    {
      provide: LogIn,
      useFactory: (...dependencies: ConstructorParameters<typeof LogIn>) =>
        new LogIn(...dependencies),
      inject: [UserRepository, PasswordHasher, SessionOpener],
    },
    {
      provide: LogOut,
      useFactory: (...dependencies: ConstructorParameters<typeof LogOut>) =>
        new LogOut(...dependencies),
      inject: [SessionRepository, SessionTokenService],
    },
    {
      provide: GetCurrentUser,
      useFactory: (...dependencies: ConstructorParameters<typeof GetCurrentUser>) =>
        new GetCurrentUser(...dependencies),
      inject: [UserRepository, SessionRepository, SessionTokenService, Clock],
    },
    SessionCookie,
    { provide: APP_GUARD, useClass: AuthenticationGuard },
  ],
})
export class IdentityModule {}
