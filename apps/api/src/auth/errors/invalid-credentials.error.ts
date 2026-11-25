import { DomainError } from '../../shared/errors/domain.error.js';

export class InvalidCredentialsError extends DomainError {
  override readonly kind = 'unauthenticated';
  override readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('E-mail ou mot de passe incorrect');
  }
}
