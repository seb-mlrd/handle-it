import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { SessionTokenService } from './session-token.service.js';

const TOKEN_BYTES = 32;

/** Un hachage rapide suffit : le jeton est aléatoire, donc impossible à deviner. */
@Injectable()
export class Sha256SessionTokenService extends SessionTokenService {
  override generate(): string {
    return randomBytes(TOKEN_BYTES).toString('base64url');
  }

  override hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
