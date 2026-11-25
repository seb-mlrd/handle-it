import type { User } from '../domain/user.js';

/** Session ouverte : seul moment où le jeton en clair est disponible. */
export interface OpenedSession {
  readonly user: User;
  readonly token: string;
  readonly expiresAt: Date;
}
