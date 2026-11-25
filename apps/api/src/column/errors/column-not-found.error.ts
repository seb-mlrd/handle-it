import { DomainError } from '../../shared/errors/domain.error.js';

export class ColumnNotFoundError extends DomainError {
  override readonly kind = 'not-found';
  override readonly code = 'NOT_FOUND';

  constructor() {
    super('Colonne introuvable sur ce board');
  }
}
