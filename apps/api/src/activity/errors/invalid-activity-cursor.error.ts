import { DomainError } from '../../shared/errors/domain.error.js';

export class InvalidActivityCursorError extends DomainError {
  override readonly kind = 'invalid';
  override readonly code = 'INVALID_REQUEST';

  constructor() {
    super("Curseur d'historique invalide");
  }
}
