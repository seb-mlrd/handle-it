import type { Clock } from '../shared/time/clock.js';
import { Session } from './session.entity.js';
import type { SessionRepository } from './session.repository.js';
import type { SessionTokenService } from './session-token.service.js';

const SESSION_DURATION_MILLISECONDS = 14 * 24 * 60 * 60 * 1000;

/** Session ouverte : seul moment où le jeton en clair est disponible. */
export interface OpenedSession {
  readonly token: string;
  readonly expiresAt: Date;
}

/** Cycle de vie des sessions : ouverture, lecture et révocation. */
export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly sessionTokenService: SessionTokenService,
    private readonly clock: Clock,
  ) {}

  /** Ouvre une session et renvoie son jeton. */
  async open(userId: string): Promise<OpenedSession> {
    const now = this.clock.now();
    const token = this.sessionTokenService.generate();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MILLISECONDS);
    // Purge opportuniste : évite une tâche planifiée pour un volume modeste.
    await this.sessionRepository.deleteExpired(now);
    const tokenHash = this.sessionTokenService.hash(token);
    await this.sessionRepository.add(new Session(userId, tokenHash, expiresAt));
    return { token, expiresAt };
  }

  /** Renvoie le propriétaire d'une session valide, ou `null`. */
  async findUserId(token: string): Promise<string | null> {
    const tokenHash = this.sessionTokenService.hash(token);
    const session = await this.sessionRepository.findByTokenHash(tokenHash);
    return session && !session.isExpired(this.clock.now()) ? session.getUserId() : null;
  }

  /** Révoque la session ; sans effet si elle n'existe plus. */
  async revoke(token: string): Promise<void> {
    await this.sessionRepository.deleteByTokenHash(this.sessionTokenService.hash(token));
  }
}
