import { DomainError } from '../../shared/errors/domain.error.js';

export class LabelNotFoundError extends DomainError {
  override readonly kind = 'not-found';
  override readonly code = 'NOT_FOUND';

  constructor() {
    super('Label introuvable sur ce board');
  }
}
