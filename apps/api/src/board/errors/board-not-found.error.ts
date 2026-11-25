import { DomainError } from '../../shared/errors/domain.error.js';

/** Aussi levée pour un non-membre : l'existence d'un board ne lui est pas révélée. */
export class BoardNotFoundError extends DomainError {
  override readonly kind = 'not-found';
  override readonly code = 'NOT_FOUND';

  constructor() {
    super('Board introuvable');
  }
}
