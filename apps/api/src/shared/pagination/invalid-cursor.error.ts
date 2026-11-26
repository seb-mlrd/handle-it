import { DomainError } from '../errors/domain.error.js';

export class InvalidCursorError extends DomainError {
  override readonly kind = 'invalid';
  override readonly code = 'INVALID_REQUEST';

  constructor() {
    super('Curseur de pagination invalide');
  }
}
