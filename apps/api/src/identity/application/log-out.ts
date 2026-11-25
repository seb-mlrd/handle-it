import type { SessionRepository } from './session-repository.js';
import type { SessionTokenService } from './session-token-service.js';

/** Cas d'usage : révoquer la session courante. */
export class LogOut {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  async execute(token: string): Promise<void> {
    await this.sessionRepository.deleteByTokenHash(this.sessionTokenService.hash(token));
  }
}
