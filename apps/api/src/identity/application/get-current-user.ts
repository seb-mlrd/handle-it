import { UnauthenticatedError } from '../domain/unauthenticated-error.js';
import type { User } from '../domain/user.js';
import type { Clock } from './clock.js';
import type { SessionRepository } from './session-repository.js';
import type { SessionTokenService } from './session-token-service.js';
import type { UserRepository } from './user-repository.js';

/** Cas d'usage : retrouver l'utilisateur à partir de son jeton de session. */
export class GetCurrentUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionTokenService: SessionTokenService,
    private readonly clock: Clock,
  ) {}

  async execute(token: string): Promise<User> {
    const tokenHash = this.sessionTokenService.hash(token);
    const session = await this.sessionRepository.findByTokenHash(tokenHash);
    if (!session || session.isExpired(this.clock.now())) {
      throw new UnauthenticatedError();
    }
    const user = await this.userRepository.findById(session.getUserId());
    if (!user) {
      throw new UnauthenticatedError();
    }
    return user;
  }
}
