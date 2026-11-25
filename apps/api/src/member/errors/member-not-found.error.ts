import { DomainError } from '../../shared/errors/domain.error.js';

export class MemberNotFoundError extends DomainError {
  override readonly kind = 'not-found';
  override readonly code = 'NOT_FOUND';

  constructor() {
    super('Membre introuvable sur ce board');
  }
}
