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
import { PublicRoute } from '../shared/http/public-route.decorator.js';
import { ZodValidationPipe } from '../shared/http/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';
import type { AuthenticatedSession } from './authenticated-session.js';
import type { User } from '../user/user.entity.js';
import { CurrentUser } from './current-user.decorator.js';
import { type CookieRequest, type CookieResponse, SessionCookie } from './session-cookie.js';
import { presentUser } from '../user/user.presenter.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
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
    return this.startSession(response, await this.authService.register(request));
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
    return this.startSession(response, await this.authService.logIn(request));
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
      await this.authService.logOut(token);
    }
    this.sessionCookie.clear(response);
  }

  /** Renvoie l'utilisateur connecté. */
  @Get('me')
  getMe(@CurrentUser() user: User): UserResponse {
    return presentUser(user);
  }

  private startSession(response: CookieResponse, session: AuthenticatedSession): UserResponse {
    this.sessionCookie.write(response, session.token, session.expiresAt);
    return presentUser(session.user);
  }
}
