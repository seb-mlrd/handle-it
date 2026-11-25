import type { Email } from '../domain/email.js';
import type { User } from '../domain/user.js';

export abstract class UserRepository {
  /** Lève `EmailAlreadyUsedError` si l'adresse appartient déjà à un compte. */
  abstract add(user: User): Promise<void>;
  abstract findByEmail(email: Email): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
}
