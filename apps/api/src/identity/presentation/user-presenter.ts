import type { UserResponse } from '@handle-it/contracts';
import type { User } from '../domain/user.js';

/** Ne laisse sortir que les champs publics de l'utilisateur. */
export function presentUser(user: User): UserResponse {
  return {
    id: user.getId(),
    email: user.getEmail().getValue(),
    displayName: user.getDisplayName(),
  };
}
