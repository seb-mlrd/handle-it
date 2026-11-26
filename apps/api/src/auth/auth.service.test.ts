import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailAlreadyUsedError } from '../user/errors/email-already-used.error.js';
import { InvalidCredentialsError } from './errors/invalid-credentials.error.js';
import type { Session } from '../session/session.entity.js';
import { UnauthenticatedError } from './errors/unauthenticated.error.js';
import type { User } from '../user/user.entity.js';
import { SessionService } from '../session/session.service.js';
import { AuthService } from './auth.service.js';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const START = new Date('2026-01-01T00:00:00.000Z');
const REQUEST = { email: 'ada@example.com', displayName: 'Ada', password: 'mot-de-passe-long' };

function createContext() {
  const users: User[] = [];
  let sessions: Session[] = [];
  let now = START;
  let tokenCount = 0;
  const userRepository = {
    add: async (user: User) => {
      if (users.some((other) => other.getEmail().getValue() === user.getEmail().getValue())) {
        throw new EmailAlreadyUsedError();
      }
      users.push(user);
    },
    findByEmail: async (email: ReturnType<User['getEmail']>) =>
      users.find((user) => user.getEmail().getValue() === email.getValue()) ?? null,
    findById: async (id: string) => users.find((user) => user.getId() === id) ?? null,
  };
  const sessionRepository = {
    add: async (session: Session) => void sessions.push(session),
    findByTokenHash: async (hash: string) =>
      sessions.find((session) => session.getTokenHash() === hash) ?? null,
    deleteByTokenHash: async (hash: string) => {
      sessions = sessions.filter((session) => session.getTokenHash() !== hash);
    },
    deleteExpired: async (date: Date) => {
      sessions = sessions.filter((session) => !session.isExpired(date));
    },
  };
  const passwordHasher = {
    hash: async (password: string) => `empreinte:${password}`,
    simulateVerification: vi.fn(async () => undefined),
    verify: async (hash: string, password: string) => hash === `empreinte:${password}`,
  };
  const tokenService = {
    generate: () => `jeton-${++tokenCount}`,
    hash: (token: string) => `sha:${token}`,
  };
  const sessionDisconnector = { disconnect: vi.fn() };
  const clock = { now: () => now };
  const sessionService = new SessionService(
    sessionRepository,
    tokenService,
    clock,
    sessionDisconnector,
  );
  return {
    passwordHasher,
    sessionDisconnector,
    getUsers: () => users,
    getSessions: () => sessions,
    advanceDays: (days: number) => {
      now = new Date(now.getTime() + days * DAY_MILLISECONDS);
    },
    authService: new AuthService(userRepository, passwordHasher, sessionService),
  };
}

let context: ReturnType<typeof createContext>;
beforeEach(() => {
  context = createContext();
});

describe('AuthService.register', () => {
  it('crée le compte et ouvre une session sans stocker de secret en clair', async () => {
    const opened = await context.authService.register(REQUEST);
    expect(context.getUsers()[0]?.getPasswordHash()).toBe('empreinte:mot-de-passe-long');
    expect(context.getSessions()[0]?.getTokenHash()).toBe('sha:jeton-1');
    expect(opened.expiresAt).toEqual(new Date(START.getTime() + 14 * DAY_MILLISECONDS));
  });

  it('refuse une adresse déjà utilisée, quelle que soit la casse', async () => {
    await context.authService.register(REQUEST);
    const again = context.authService.register({ ...REQUEST, email: 'ADA@example.com' });
    await expect(again).rejects.toThrow(EmailAlreadyUsedError);
    expect(context.getSessions()).toHaveLength(1);
  });
});

describe('AuthService.logIn', () => {
  it('ouvre une nouvelle session', async () => {
    await context.authService.register(REQUEST);
    expect((await context.authService.logIn(REQUEST)).token).toBe('jeton-2');
  });

  it('refuse un mauvais mot de passe', async () => {
    await context.authService.register(REQUEST);
    const attempt = context.authService.logIn({ ...REQUEST, password: 'faux' });
    await expect(attempt).rejects.toThrow(InvalidCredentialsError);
  });

  it('simule la vérification pour un compte inconnu, avec la même erreur', async () => {
    await expect(context.authService.logIn(REQUEST)).rejects.toThrow(InvalidCredentialsError);
    expect(context.passwordHasher.simulateVerification).toHaveBeenCalledOnce();
  });

  it('purge les sessions expirées', async () => {
    await context.authService.register(REQUEST);
    context.advanceDays(15);
    await context.authService.logIn(REQUEST);
    expect(context.getSessions()).toHaveLength(1);
  });
});

describe('AuthService.getCurrentUser et logOut', () => {
  it("retrouve l'utilisateur", async () => {
    const { token } = await context.authService.register(REQUEST);
    expect((await context.authService.getCurrentUser(token)).getDisplayName()).toBe('Ada');
  });

  it('refuse un jeton inconnu', async () => {
    await expect(context.authService.getCurrentUser('faux')).rejects.toThrow(UnauthenticatedError);
  });

  it('refuse une session expirée', async () => {
    const { token } = await context.authService.register(REQUEST);
    context.advanceDays(14);
    await expect(context.authService.getCurrentUser(token)).rejects.toThrow(UnauthenticatedError);
  });

  it("refuse la session d'un compte supprimé", async () => {
    const { token } = await context.authService.register(REQUEST);
    context.getUsers().pop();
    await expect(context.authService.getCurrentUser(token)).rejects.toThrow(UnauthenticatedError);
  });

  it('ne révoque que la session courante', async () => {
    const first = await context.authService.register(REQUEST);
    const second = await context.authService.logIn(REQUEST);
    await context.authService.logOut(first.token);
    expect(context.sessionDisconnector.disconnect).toHaveBeenCalledExactlyOnceWith('sha:jeton-1');
    await expect(context.authService.getCurrentUser(first.token)).rejects.toThrow(
      UnauthenticatedError,
    );
    expect(await context.authService.getCurrentUser(second.token)).toBeDefined();
  });
});
