import { DomainError } from '../../shared/errors/domain.error.js';

export class BoardActionForbiddenError extends DomainError {
  override readonly kind = 'forbidden';
  override readonly code = 'FORBIDDEN';

  constructor() {
    super('Le rôle sur ce board ne permet pas cette action');
  }
}
