import type { Email } from './email.js';

export class User {
  constructor(
    private readonly id: string,
    private readonly email: Email,
    private readonly displayName: string,
    private readonly passwordHash: string,
  ) {}

  getId(): string {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getDisplayName(): string {
    return this.displayName;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }
}
