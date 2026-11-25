import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Environment } from '../../config/environment.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

interface OriginRequest {
  readonly method: string;
  readonly headers: { readonly origin?: string };
}

/** Protection CSRF : une écriture n'est acceptée que depuis l'origine du front. */
@Injectable()
export class OriginGuard implements CanActivate {
  constructor(@Inject(Environment) private readonly environment: Environment) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<OriginRequest>();
    const isAllowed =
      SAFE_METHODS.has(request.method) ||
      request.headers.origin === this.environment.getWebOrigin();
    if (!isAllowed) {
      throw new ForbiddenException();
    }
    return true;
  }
}
