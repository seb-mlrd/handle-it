import { DomainError } from '../../shared/domain/domain-error.js';

export class InvalidCredentialsError extends DomainError {
  override readonly kind = 'unauthenticated';
  override readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('E-mail ou mot de passe incorrect');
  }
}
