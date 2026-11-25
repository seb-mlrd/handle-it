import { DomainError } from '../../shared/errors/domain.error.js';

export class InvalidEmailError extends DomainError {
  override readonly kind = 'invalid';
  override readonly code = 'INVALID_REQUEST';

  constructor() {
    super("L'adresse e-mail est invalide");
  }
}
