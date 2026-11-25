import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardAccessPolicy } from '../board/board-access-policy.js';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardNotFoundError } from '../board/errors/board-not-found.error.js';
import { Membership } from '../board/membership.entity.js';
import { RankConflictError } from '../shared/ranking/rank-conflict.error.js';
import { Rank } from '../shared/ranking/rank.value-object.js';
import { ColumnService } from './column.service.js';
import { createBoardRepository, createColumnRepository } from '../testing/repositories.js';

const boards = createBoardRepository();
const columns = createColumnRepository();
const service = new ColumnService(columns, new BoardAccessService(boards, new BoardAccessPolicy()));
const request = { name: 'À faire' };

beforeEach(() => {
  vi.resetAllMocks();
  boards.findMembership.mockResolvedValue(new Membership('board', 'bob', 'member'));
});

describe('ColumnService', () => {
  it('place une nouvelle colonne après la dernière', async () => {
    const last = Rank.between(null, null);
    columns.findLastRank.mockResolvedValue(last);
    const column = await service.create('bob', 'board', request);
    expect(column.getRank().getValue() > last.getValue()).toBe(true);
    expect(columns.add).toHaveBeenCalledWith(column);
  });

  it('recalcule le rang si un autre vient de le prendre', async () => {
    const taken = Rank.between(null, null);
    columns.findLastRank.mockResolvedValueOnce(null).mockResolvedValueOnce(taken);
    columns.add.mockRejectedValueOnce(new RankConflictError());
    const column = await service.create('bob', 'board', request);
    expect(column.getRank()).toEqual(Rank.between(taken, null));
  });

  it('refuse tout à un non-membre, sans toucher aux colonnes', async () => {
    boards.findMembership.mockResolvedValue(null);
    const attempts = [
      () => service.list('eve', 'board'),
      () => service.create('eve', 'board', request),
      () => service.rename('eve', 'board', 'colonne', request),
      () => service.delete('eve', 'board', 'colonne'),
    ];
    for (const attempt of attempts) {
      await expect(attempt()).rejects.toThrow(BoardNotFoundError);
    }
    for (const method of Object.values(columns)) {
      expect(method).not.toHaveBeenCalled();
    }
  });
});
