import { randomUUID } from 'node:crypto';
import type { RegisterRequest } from '@handle-it/contracts';
import { Email } from '../domain/email.js';
import { User } from '../domain/user.js';
import type { OpenedSession } from './opened-session.js';
import type { PasswordHasher } from './password-hasher.js';
import type { SessionOpener } from './session-opener.js';
import type { UserRepository } from './user-repository.js';

/** Cas d'usage : créer un compte et connecter son propriétaire. */
export class RegisterUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionOpener: SessionOpener,
  ) {}

  async execute(request: RegisterRequest): Promise<OpenedSession> {
    const email = Email.create(request.email);
    const passwordHash = await this.passwordHasher.hash(request.password);
    const user = new User(randomUUID(), email, request.displayName, passwordHash);
    await this.userRepository.add(user);
    return this.sessionOpener.open(user);
  }
}
