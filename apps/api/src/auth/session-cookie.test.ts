import { describe, expect, it, vi } from 'vitest';
import { Environment } from '../config/environment.js';
import { SessionCookie } from './session-cookie.js';

describe('SessionCookie', () => {
  it('est Secure et préfixé en HTTPS', () => {
    const environment = Environment.fromVariables({
      DATABASE_URL: 'postgresql://localhost/base',
      WEB_ORIGIN: 'https://app.example.com',
    });
    const response = { cookie: vi.fn(), clearCookie: vi.fn() };
    const expires = new Date(0);
    new SessionCookie(environment).write(response, 'jeton', expires);
    expect(response.cookie).toHaveBeenCalledWith('__Host-session', 'jeton', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires,
    });
  });
});
