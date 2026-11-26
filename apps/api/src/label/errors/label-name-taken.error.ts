import { DomainError } from '../../shared/errors/domain.error.js';

export class LabelNameTakenError extends DomainError {
  override readonly kind = 'conflict';
  override readonly code = 'LABEL_NAME_TAKEN';

  constructor() {
    super('Un label porte déjà ce nom sur ce board');
  }
}
