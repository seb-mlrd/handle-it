import type { LogInRequest } from '@handle-it/contracts';
import { Email } from '../domain/email.js';
import { InvalidCredentialsError } from '../domain/invalid-credentials-error.js';
import type { OpenedSession } from './opened-session.js';
import type { PasswordHasher } from './password-hasher.js';
import type { SessionOpener } from './session-opener.js';
import type { UserRepository } from './user-repository.js';

/** Cas d'usage : ouvrir une session à partir d'identifiants. */
export class LogIn {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionOpener: SessionOpener,
  ) {}

  async execute(request: LogInRequest): Promise<OpenedSession> {
    const user = await this.userRepository.findByEmail(Email.create(request.email));
    if (!user) {
      // Même coût que pour un compte existant : le temps de réponse ne révèle rien.
      await this.passwordHasher.simulateVerification(request.password);
      throw new InvalidCredentialsError();
    }
    if (!(await this.passwordHasher.verify(user.getPasswordHash(), request.password))) {
      throw new InvalidCredentialsError();
    }
    return this.sessionOpener.open(user);
  }
}
