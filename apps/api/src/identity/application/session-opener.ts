import { Session } from '../domain/session.js';
import type { User } from '../domain/user.js';
import type { Clock } from './clock.js';
import type { OpenedSession } from './opened-session.js';
import type { SessionRepository } from './session-repository.js';
import type { SessionTokenService } from './session-token-service.js';

const SESSION_DURATION_MILLISECONDS = 14 * 24 * 60 * 60 * 1000;

/** Ouvre une session, commune à l'inscription et à la connexion. */
export class SessionOpener {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly sessionTokenService: SessionTokenService,
    private readonly clock: Clock,
  ) {}

  async open(user: User): Promise<OpenedSession> {
    const now = this.clock.now();
    const token = this.sessionTokenService.generate();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MILLISECONDS);
    // Purge opportuniste : évite une tâche planifiée pour un volume modeste.
    await this.sessionRepository.deleteExpired(now);
    const tokenHash = this.sessionTokenService.hash(token);
    await this.sessionRepository.add(new Session(user.getId(), tokenHash, expiresAt));
    return { user, token, expiresAt };
  }
}
