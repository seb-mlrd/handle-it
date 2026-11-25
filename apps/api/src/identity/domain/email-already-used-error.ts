import { DomainError } from '../../shared/domain/domain-error.js';

export class EmailAlreadyUsedError extends DomainError {
  override readonly kind = 'conflict';
  override readonly code = 'EMAIL_ALREADY_USED';

  constructor() {
    super("L'adresse e-mail est déjà utilisée");
  }
}
