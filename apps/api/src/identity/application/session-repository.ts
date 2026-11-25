import type { Session } from '../domain/session.js';

export abstract class SessionRepository {
  abstract add(session: Session): Promise<void>;
  abstract findByTokenHash(tokenHash: string): Promise<Session | null>;
  abstract deleteByTokenHash(tokenHash: string): Promise<void>;
  abstract deleteExpired(now: Date): Promise<void>;
}
