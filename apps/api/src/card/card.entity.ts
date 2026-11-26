import type { DueDate } from './due-date.value-object.js';
import type { Rank } from '../shared/ranking/rank.value-object.js';

export class Card {
  constructor(
    private readonly id: string,
    private readonly columnId: string,
    private readonly title: string,
    private readonly description: string,
    private readonly rank: Rank,
    private readonly dueOn: DueDate | null = null,
  ) {}

  /** Échéance, ou `null` sans échéance. */
  getDueOn(): DueDate | null {
    return this.dueOn;
  }

  getId(): string {
    return this.id;
  }

  getColumnId(): string {
    return this.columnId;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
  }

  getRank(): Rank {
    return this.rank;
  }
}
