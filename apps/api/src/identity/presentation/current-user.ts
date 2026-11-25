import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { UnauthenticatedError } from '../domain/unauthenticated-error.js';
import type { User } from '../domain/user.js';
import type { AuthenticatedRequest } from './authenticated-request.js';

/** Injecte l'utilisateur connecté dans une route protégée. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const { currentUser } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!currentUser) {
      throw new UnauthenticatedError();
    }
    return currentUser;
  },
);
