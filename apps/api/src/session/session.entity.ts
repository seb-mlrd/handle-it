/** Session révocable : seule l'empreinte du jeton est connue du serveur. */
export class Session {
  constructor(
    private readonly userId: string,
    private readonly tokenHash: string,
    private readonly expiresAt: Date,
  ) {}

  isExpired(now: Date): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  getUserId(): string {
    return this.userId;
  }

  getTokenHash(): string {
    return this.tokenHash;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }
}
