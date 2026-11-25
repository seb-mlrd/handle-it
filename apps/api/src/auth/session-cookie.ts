import { Inject, Injectable } from '@nestjs/common';
import { Environment } from '../config/environment.js';

interface CookieOptions {
  readonly httpOnly: boolean;
  readonly secure: boolean;
  readonly sameSite: 'lax';
  readonly path: string;
}

export interface CookieRequest {
  readonly cookies: Readonly<Record<string, unknown>>;
}

export interface CookieResponse {
  cookie(name: string, value: string, options: CookieOptions & { expires: Date }): unknown;
  clearCookie(name: string, options: CookieOptions): unknown;
}

/** Seul endroit qui connaît le nom et les attributs du cookie de session. */
@Injectable()
export class SessionCookie {
  private readonly name: string;
  private readonly options: CookieOptions;

  constructor(@Inject(Environment) environment: Environment) {
    const secure = environment.isWebOriginSecure();
    // Le préfixe __Host- interdit à un sous-domaine d'imposer son propre cookie, mais exige HTTPS.
    this.name = secure ? '__Host-session' : 'session';
    this.options = { httpOnly: true, secure, sameSite: 'lax', path: '/' };
  }

  read(request: CookieRequest): string | null {
    const value = request.cookies[this.name];
    return typeof value === 'string' && value !== '' ? value : null;
  }

  write(response: CookieResponse, token: string, expires: Date): void {
    response.cookie(this.name, token, { ...this.options, expires });
  }

  clear(response: CookieResponse): void {
    response.clearCookie(this.name, this.options);
  }
}
