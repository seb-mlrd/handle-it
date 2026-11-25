import type { BoardRole } from '@handle-it/contracts';

/** Appartenance d'un utilisateur à un board. */
export class Membership {
  constructor(
    private readonly boardId: string,
    private readonly userId: string,
    private readonly role: BoardRole,
  ) {}

  getBoardId(): string {
    return this.boardId;
  }

  getUserId(): string {
    return this.userId;
  }

  getRole(): BoardRole {
    return this.role;
  }
}
