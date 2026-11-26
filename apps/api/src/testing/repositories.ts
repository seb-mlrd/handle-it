import type { BoardEvent } from '@handle-it/contracts';
import { vi } from 'vitest';
import type { ActivityEntry } from '../activity/activity-entry.js';
import { type BoardChange, BoardChanges } from '../board/board-changes.js';

/** Doublures de repositories partagées par les tests unitaires. */
export const createBoardRepository = () => ({
  add: vi.fn(),
  addMember: vi.fn(),
  findAllByUser: vi.fn(),
  findById: vi.fn(),
  findMembership: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

export const createColumnRepository = () => ({
  add: vi.fn(),
  areOnBoard: vi.fn(),
  getList: vi.fn(),
  move: vi.fn(),
  exists: vi.fn(),
  findById: vi.fn(),
  findAllByBoard: vi.fn(),
  findLastRank: vi.fn(),
  rename: vi.fn(),
  delete: vi.fn(),
});

/** Exécute les modifications sans transaction et garde leurs événements. */
export class InMemoryBoardChanges extends BoardChanges {
  readonly events: BoardEvent[] = [];
  readonly activities: { actorId: string; entry: ActivityEntry }[] = [];

  override async run<Result>(
    _boardId: string,
    actorId: string,
    change: () => Promise<BoardChange<Result>>,
  ) {
    const { result, event, activity } = await change();
    this.events.push(event);
    if (activity) this.activities.push({ actorId, entry: activity });
    return result;
  }

  override readConsistently<Result>(read: () => Promise<Result>) {
    return read();
  }
}
