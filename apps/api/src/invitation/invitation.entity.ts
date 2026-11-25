/** Invitation à usage unique : elle est supprimée dès qu'elle a servi. */
export class Invitation {
  constructor(
    private readonly id: string,
    private readonly boardId: string,
    private readonly tokenHash: string,
    private readonly expiresAt: Date,
  ) {}

  isExpired(now: Date): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  getId(): string {
    return this.id;
  }

  getBoardId(): string {
    return this.boardId;
  }

  getTokenHash(): string {
    return this.tokenHash;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }
}
