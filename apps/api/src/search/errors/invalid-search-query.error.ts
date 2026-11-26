import { DomainError } from '../../shared/errors/domain.error.js';

export class InvalidSearchQueryError extends DomainError {
  override readonly kind = 'invalid';
  override readonly code = 'INVALID_REQUEST';

  constructor() {
    super('La recherche ne contient aucun mot');
  }
}
