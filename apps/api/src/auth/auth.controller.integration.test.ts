import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestServer } from '../testing/test-server.js';

const ACCOUNT = { email: 'ada@example.com', displayName: 'Ada', password: 'mot-de-passe-long' };
const CREDENTIALS = { email: ACCOUNT.email, password: ACCOUNT.password };

let server: TestServer;
beforeEach(async () => {
  server = await TestServer.start();
});
afterEach(async () => {
  await server.stop();
});

const register = (body: unknown = ACCOUNT) => server.send('POST', '/auth/register', { body });
const logIn = (body: unknown = CREDENTIALS) => server.send('POST', '/auth/login', { body });
const getMe = (cookie?: string) => server.send('GET', '/auth/me', cookie ? { cookie } : {});

function readCookie(response: Response): string {
  return response.headers.get('set-cookie')?.split(';')[0] ?? '';
}

describe('inscription', () => {
  it("connecte l'utilisateur et n'expose que ses champs publics", async () => {
    const response = await register();
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: expect.any(String),
      email: ACCOUNT.email,
      displayName: ACCOUNT.displayName,
    });
    expect((await getMe(readCookie(response))).status).toBe(200);
  });

  it('pose un cookie httpOnly et SameSite', async () => {
    const cookie = (await register()).headers.get('set-cookie');
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).not.toMatch(/Domain/);
  });

  it('ne stocke ni mot de passe ni jeton en clair', async () => {
    const token = readCookie(await register()).split('=')[1];
    const user = await server.getDatabase().user.findFirstOrThrow();
    const session = await server.getDatabase().session.findFirstOrThrow();
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    expect(session.tokenHash).toHaveLength(64);
    expect(session.tokenHash).not.toBe(token);
  });

  it('refuse une adresse déjà utilisée, quelle que soit la casse', async () => {
    await register();
    const response = await register({ ...ACCOUNT, email: 'ADA@example.com' });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code: 'EMAIL_ALREADY_USED' });
  });

  it('ne crée qu’un compte pour deux inscriptions simultanées', async () => {
    const responses = await Promise.all([register(), register()]);
    expect(responses.map(({ status }) => status).sort()).toEqual([201, 409]);
    expect(await server.getDatabase().user.count()).toBe(1);
  });

  it('renvoie les erreurs par champ', async () => {
    const response = await register({ email: 'faux', displayName: 'Ada', password: 'court' });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { code: string; fieldErrors: object };
    expect(body.code).toBe('INVALID_REQUEST');
    expect(Object.keys(body.fieldErrors).sort()).toEqual(['email', 'password']);
  });
});

describe('connexion', () => {
  it('ouvre une session', async () => {
    await register();
    const response = await logIn();
    expect(response.status).toBe(200);
    expect((await getMe(readCookie(response))).status).toBe(200);
  });

  it('répond à l’identique pour un compte inconnu et un mauvais mot de passe', async () => {
    await register();
    const wrongPassword = await logIn({ ...CREDENTIALS, password: 'faux' });
    const unknownAccount = await logIn({ ...CREDENTIALS, email: 'inconnu@example.com' });
    expect(wrongPassword.status).toBe(401);
    expect(unknownAccount.status).toBe(401);
    expect(await wrongPassword.json()).toEqual({ code: 'INVALID_CREDENTIALS' });
    expect(await unknownAccount.json()).toEqual({ code: 'INVALID_CREDENTIALS' });
    expect(wrongPassword.headers.get('set-cookie')).toBeNull();
  });

  it('bloque après dix tentatives', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await logIn()).status).toBe(401);
    }
    const response = await logIn();
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ code: 'TOO_MANY_REQUESTS' });
  });
});

describe('session', () => {
  it.each([undefined, 'session=faux'])('refuse le cookie %s', async (cookie) => {
    const response = await getMe(cookie);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ code: 'UNAUTHENTICATED' });
  });

  it('refuse une session expirée', async () => {
    const cookie = readCookie(await register());
    await server.getDatabase().session.updateMany({ data: { expiresAt: new Date(0) } });
    expect((await getMe(cookie)).status).toBe(401);
  });

  it('est purgée une fois expirée, à la connexion suivante', async () => {
    await register();
    await server.getDatabase().session.updateMany({ data: { expiresAt: new Date(0) } });
    await logIn();
    expect(await server.getDatabase().session.count()).toBe(1);
  });

  it('est révoquée côté serveur à la déconnexion', async () => {
    const cookie = readCookie(await register());
    const response = await server.send('POST', '/auth/logout', { cookie });
    expect(response.status).toBe(204);
    expect(readCookie(response)).toBe('session=');
    expect((await getMe(cookie)).status).toBe(401);
  });

  it('accepte une déconnexion sans session', async () => {
    expect((await server.send('POST', '/auth/logout')).status).toBe(204);
  });
});

describe('protections transverses', () => {
  it.each([null, 'https://pirate.example', 'null'])(
    'refuse une écriture depuis %s',
    async (origin) => {
      const response = await server.send('POST', '/auth/login', { body: CREDENTIALS, origin });
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ code: 'FORBIDDEN' });
    },
  );

  it('laisse la route de santé publique', async () => {
    const response = await server.send('GET', '/health', { origin: null });
    expect(response.status).toBe(200);
  });

  it.each(['/health', '/inconnue'])('pose les en-têtes de sécurité sur %s', async (path) => {
    const { headers } = await server.send('GET', path);
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('x-frame-options')).toBe('DENY');
    expect(headers.get('cache-control')).toBe('no-store');
    expect(headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    expect(headers.get('x-powered-by')).toBeNull();
  });

  it('renvoie le format commun pour une route inconnue', async () => {
    const response = await server.send('GET', '/inconnue');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ code: 'NOT_FOUND' });
  });

  it('refuse un corps trop gros sans erreur interne', async () => {
    const response = await logIn({ ...CREDENTIALS, password: 'a'.repeat(200_000) });
    expect(response.status).toBe(413);
  });
});
