import type { User } from '../user/user.entity.js';
import type { CookieRequest } from './session-cookie.js';

/** Requête HTTP enrichie par la garde d'authentification. */
export interface AuthenticatedRequest extends CookieRequest {
  currentUser?: User;
}
