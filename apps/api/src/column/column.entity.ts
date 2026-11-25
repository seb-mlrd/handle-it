import type { Rank } from '../shared/ranking/rank.value-object.js';

export class Column {
  constructor(
    private readonly id: string,
    private readonly boardId: string,
    private readonly name: string,
    private readonly rank: Rank,
  ) {}

  getId(): string {
    return this.id;
  }

  getBoardId(): string {
    return this.boardId;
  }

  getName(): string {
    return this.name;
  }

  getRank(): Rank {
    return this.rank;
  }
}
