import { DomainError } from '../errors/domain.error.js';

export class InvalidPlacementError extends DomainError {
  override readonly kind = 'invalid';
  override readonly code = 'INVALID_REQUEST';

  constructor() {
    super('Un élément ne peut pas être son propre voisin');
  }
}
