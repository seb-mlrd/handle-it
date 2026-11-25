import { DomainError } from '../../shared/errors/domain.error.js';

/** Même erreur pour un lien inconnu, expiré ou déjà utilisé. */
export class InvitationInvalidError extends DomainError {
  override readonly kind = 'not-found';
  override readonly code = 'INVITATION_INVALID';

  constructor() {
    super("L'invitation n'est pas ou plus valable");
  }
}
