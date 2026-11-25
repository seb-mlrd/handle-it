import { randomBytes } from 'node:crypto';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { argon2id, hash, verify } from 'argon2';
import { PasswordHasher } from '../application/password-hasher.js';

// Paramètres minimaux recommandés par l'OWASP pour argon2id.
const HASH_OPTIONS = { type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;
const DECOY_BYTES = 32;

@Injectable()
export class Argon2PasswordHasher extends PasswordHasher implements OnModuleInit {
  private decoyHash = '';

  // Préparée au démarrage : la première connexion ne doit pas être plus lente que les autres.
  async onModuleInit(): Promise<void> {
    this.decoyHash = await this.hash(randomBytes(DECOY_BYTES).toString('hex'));
  }

  override hash(password: string): Promise<string> {
    return hash(password, HASH_OPTIONS);
  }

  override verify(passwordHash: string, password: string): Promise<boolean> {
    return verify(passwordHash, password);
  }

  override async simulateVerification(password: string): Promise<void> {
    await this.verify(this.decoyHash, password);
  }
}
