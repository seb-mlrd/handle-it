import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { SessionModule } from '../session/session.module.js';
import { SessionService } from '../session/session.service.js';
import { UserModule } from '../user/user.module.js';
import { UserRepository } from '../user/user.repository.js';
import { Argon2PasswordHasher } from './argon2-password-hasher.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { PasswordHasher } from './password-hasher.js';
import { SessionCookie } from './session-cookie.js';

const MAX_ATTEMPTS = 10;
const ATTEMPTS_WINDOW_MILLISECONDS = 15 * 60 * 1000;

@Module({
  imports: [
    UserModule,
    SessionModule,
    ThrottlerModule.forRoot([{ limit: MAX_ATTEMPTS, ttl: ATTEMPTS_WINDOW_MILLISECONDS }]),
  ],
  controllers: [AuthController],
  providers: [
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    {
      provide: AuthService,
      useFactory: (...dependencies: ConstructorParameters<typeof AuthService>) =>
        new AuthService(...dependencies),
      inject: [UserRepository, PasswordHasher, SessionService],
    },
    SessionCookie,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
