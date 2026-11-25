import type { Email } from './email.value-object.js';
import type { User } from './user.entity.js';

export abstract class UserRepository {
  /** Lève `EmailAlreadyUsedError` si l'adresse appartient déjà à un compte. */
  abstract add(user: User): Promise<void>;
  abstract findByEmail(email: Email): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
}
