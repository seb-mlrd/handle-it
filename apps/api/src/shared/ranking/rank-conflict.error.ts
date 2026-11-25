import { DomainError } from '../errors/domain.error.js';

/** Deux éléments ont visé le même rang en même temps. */
export class RankConflictError extends DomainError {
  override readonly kind = 'conflict';
  override readonly code = 'CONFLICT';

  constructor() {
    super('Ce rang vient d’être pris');
  }
}
