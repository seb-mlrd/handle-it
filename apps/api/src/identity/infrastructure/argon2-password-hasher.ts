import { Injectable } from '@nestjs/common';
import { argon2id, hash, verify } from 'argon2';
import { PasswordHasher } from '../application/password-hasher.js';

// Paramètres minimaux recommandés par l'OWASP pour argon2id.
const HASH_OPTIONS = { type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

@Injectable()
export class Argon2PasswordHasher extends PasswordHasher {
  override hash(password: string): Promise<string> {
    return hash(password, HASH_OPTIONS);
  }

  override verify(passwordHash: string, password: string): Promise<boolean> {
    return verify(passwordHash, password);
  }
}
