export abstract class SessionTokenService {
  /** Produit un jeton imprévisible, remis au seul client. */
  abstract generate(): string;
  /** Calcule l'empreinte stockée côté serveur. */
  abstract hash(token: string): string;
}
