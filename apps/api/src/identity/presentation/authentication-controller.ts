import {
  type LogInRequest,
  logInRequestSchema,
  type RegisterRequest,
  registerRequestSchema,
  type UserResponse,
} from '@handle-it/contracts';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PublicRoute } from '../../shared/http/public-route.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation-pipe.js';
import { LogIn } from '../application/log-in.js';
import { LogOut } from '../application/log-out.js';
import type { OpenedSession } from '../application/opened-session.js';
import { RegisterUser } from '../application/register-user.js';
import type { User } from '../domain/user.js';
import { CurrentUser } from './current-user.js';
import { type CookieRequest, type CookieResponse, SessionCookie } from './session-cookie.js';
import { presentUser } from './user-presenter.js';

@Controller('auth')
export class AuthenticationController {
  constructor(
    @Inject(RegisterUser) private readonly registerUser: RegisterUser,
    @Inject(LogIn) private readonly logInUser: LogIn,
    @Inject(LogOut) private readonly logOutUser: LogOut,
    @Inject(SessionCookie) private readonly sessionCookie: SessionCookie,
  ) {}

  /** Crée un compte et connecte son propriétaire. */
  @Post('register')
  @PublicRoute()
  @UseGuards(ThrottlerGuard)
  async register(
    @Body(new ZodValidationPipe(registerRequestSchema)) request: RegisterRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<UserResponse> {
    return this.startSession(response, await this.registerUser.execute(request));
  }

  /** Ouvre une session. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @UseGuards(ThrottlerGuard)
  async logIn(
    @Body(new ZodValidationPipe(logInRequestSchema)) request: LogInRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<UserResponse> {
    return this.startSession(response, await this.logInUser.execute(request));
  }

  /** Révoque la session courante ; publique pour rester idempotente si elle a expiré. */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @PublicRoute()
  async logOut(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<void> {
    const token = this.sessionCookie.read(request);
    if (token) {
      await this.logOutUser.execute(token);
    }
    this.sessionCookie.clear(response);
  }

  /** Renvoie l'utilisateur connecté. */
  @Get('me')
  getMe(@CurrentUser() user: User): UserResponse {
    return presentUser(user);
  }

  private startSession(response: CookieResponse, session: OpenedSession): UserResponse {
    this.sessionCookie.write(response, session.token, session.expiresAt);
    return presentUser(session.user);
  }
}
