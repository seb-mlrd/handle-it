import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_ROUTE_KEY } from '../../shared/http/public-route.js';
import { GetCurrentUser } from '../application/get-current-user.js';
import { UnauthenticatedError } from '../domain/unauthenticated-error.js';
import type { AuthenticatedRequest } from './authenticated-request.js';
import { SessionCookie } from './session-cookie.js';

/** Exige une session valide sur toute route non marquée `PublicRoute`. */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(GetCurrentUser) private readonly getCurrentUser: GetCurrentUser,
    @Inject(SessionCookie) private readonly sessionCookie: SessionCookie,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean | undefined>(PUBLIC_ROUTE_KEY, targets)) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.sessionCookie.read(request);
    if (!token) {
      throw new UnauthenticatedError();
    }
    request.currentUser = await this.getCurrentUser.execute(token);
    return true;
  }
}
