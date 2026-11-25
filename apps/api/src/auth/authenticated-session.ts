import type { OpenedSession } from '../session/session.service.js';
import type { User } from '../user/user.entity.js';

/** Session qui vient d'être ouverte, avec son propriétaire. */
export interface AuthenticatedSession extends OpenedSession {
  readonly user: User;
}
