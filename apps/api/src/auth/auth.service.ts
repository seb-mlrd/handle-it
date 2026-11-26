import { randomUUID } from 'node:crypto';
import type { LogInRequest, RegisterRequest } from '@handle-it/contracts';
import type { SessionService } from '../session/session.service.js';
import { Email } from '../user/email.value-object.js';
import { User } from '../user/user.entity.js';
import type { UserRepository } from '../user/user.repository.js';
import type { AuthenticatedSession } from './authenticated-session.js';
import { InvalidCredentialsError } from './errors/invalid-credentials.error.js';
import { UnauthenticatedError } from './errors/unauthenticated.error.js';
import type { PasswordHasher } from './password-hasher.js';

/** Inscription, connexion et identification des utilisateurs. */
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionService: SessionService,
  ) {}

  /** Crée un compte et connecte son propriétaire. */
  async register(request: RegisterRequest): Promise<AuthenticatedSession> {
    const email = Email.create(request.email);
    const passwordHash = await this.passwordHasher.hash(request.password);
    const user = new User(randomUUID(), email, request.displayName, passwordHash);
    await this.userRepository.add(user);
    return this.openSession(user);
  }

  /** Ouvre une session à partir d'identifiants. */
  async logIn(request: LogInRequest): Promise<AuthenticatedSession> {
    const user = await this.userRepository.findByEmail(Email.create(request.email));
    if (!user) {
      // Même coût que pour un compte existant : le temps de réponse ne révèle rien.
      await this.passwordHasher.simulateVerification(request.password);
      throw new InvalidCredentialsError();
    }
    if (!(await this.passwordHasher.verify(user.getPasswordHash(), request.password))) {
      throw new InvalidCredentialsError();
    }
    return this.openSession(user);
  }

  /** Révoque la session courante. */
  async logOut(token: string): Promise<void> {
    await this.sessionService.revoke(token);
  }

  /** Retrouve l'utilisateur à partir de son jeton de session. */
  async getCurrentUser(token: string): Promise<User> {
    const session = await this.sessionService.find(token);
    const user = session && (await this.userRepository.findById(session.getUserId()));
    if (!user) {
      throw new UnauthenticatedError();
    }
    return user;
  }

  private async openSession(user: User): Promise<AuthenticatedSession> {
    return { user, ...(await this.sessionService.open(user.getId())) };
  }
}
