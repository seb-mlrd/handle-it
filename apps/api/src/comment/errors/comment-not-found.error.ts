import { DomainError } from '../../shared/errors/domain.error.js';

export class CommentNotFoundError extends DomainError {
  override readonly kind = 'not-found';
  override readonly code = 'NOT_FOUND';

  constructor() {
    super('Commentaire introuvable sur ce board');
  }
}
