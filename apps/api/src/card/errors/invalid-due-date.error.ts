import { DomainError } from '../../shared/errors/domain.error.js';

export class InvalidDueDateError extends DomainError {
  override readonly kind = 'invalid';
  override readonly code = 'INVALID_REQUEST';

  constructor() {
    super("Cette date n'existe pas");
  }
}
