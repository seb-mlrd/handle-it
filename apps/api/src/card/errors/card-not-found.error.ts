import { DomainError } from '../../shared/errors/domain.error.js';

export class CardNotFoundError extends DomainError {
  override readonly kind = 'not-found';
  override readonly code = 'NOT_FOUND';

  constructor() {
    super('Carte introuvable sur ce board');
  }
}
