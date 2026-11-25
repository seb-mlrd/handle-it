import { DomainError } from '../../shared/domain/domain-error.js';

export class UnauthenticatedError extends DomainError {
  override readonly kind = 'unauthenticated';
  override readonly code = 'UNAUTHENTICATED';

  constructor() {
    super('Une session valide est nécessaire');
  }
}
