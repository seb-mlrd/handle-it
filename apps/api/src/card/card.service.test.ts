import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardAccessPolicy } from '../board/board-access-policy.js';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardNotFoundError } from '../board/errors/board-not-found.error.js';
import { Membership } from '../board/membership.entity.js';
import { Column } from '../column/column.entity.js';
import { ColumnNotFoundError } from '../column/errors/column-not-found.error.js';
import {
  createBoardRepository,
  createColumnRepository,
  InMemoryBoardChanges,
} from '../testing/repositories.js';
import { RankConflictError } from '../shared/ranking/rank-conflict.error.js';
import { RankPlacer } from '../shared/ranking/rank-placer.js';
import { Rank } from '../shared/ranking/rank.value-object.js';
import { CardService } from './card.service.js';
import { CardNotFoundError } from './errors/card-not-found.error.js';

const boards = createBoardRepository();
const columns = createColumnRepository();
const cards = {
  add: vi.fn(),
  findSummariesByBoard: vi.fn(),
  find: vi.fn(),
  findLastRank: vi.fn(),
  areOnBoard: vi.fn(),
  getList: vi.fn(),
  move: vi.fn(),
  setDueOn: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};
const access = new BoardAccessService(boards, new BoardAccessPolicy());
const service = new CardService(
  cards,
  columns,
  access,
  new RankPlacer(),
  new InMemoryBoardChanges(),
);
const request = { title: 'Pain' };

beforeEach(() => {
  vi.resetAllMocks();
  boards.findMembership.mockResolvedValue(new Membership('board', 'bob', 'member'));
  columns.findById.mockResolvedValue(
    new Column('colonne', 'board', 'À faire', Rank.between(null, null)),
  );
});

describe('CardService', () => {
  it('place une nouvelle carte, sans description, à la fin de la colonne', async () => {
    const last = Rank.between(null, null);
    cards.findLastRank.mockResolvedValue(last);
    const card = await service.create('bob', 'board', 'colonne', request);
    expect(card.getRank()).toEqual(Rank.between(last, null));
    expect(card.getDescription()).toBe('');
    expect(cards.add).toHaveBeenCalledWith(card);
  });

  it('recalcule le rang si un autre vient de le prendre', async () => {
    const taken = Rank.between(null, null);
    cards.findLastRank.mockResolvedValueOnce(null).mockResolvedValueOnce(taken);
    cards.add.mockRejectedValueOnce(new RankConflictError());
    const card = await service.create('bob', 'board', 'colonne', request);
    expect(card.getRank()).toEqual(Rank.between(taken, null));
  });

  it("refuse une colonne qui n'est pas sur le board", async () => {
    columns.findById.mockResolvedValue(null);
    const attempt = service.create('bob', 'board', 'colonne', request);
    await expect(attempt).rejects.toThrow(ColumnNotFoundError);
    expect(cards.add).not.toHaveBeenCalled();
  });

  it('signale une carte introuvable', async () => {
    cards.find.mockResolvedValue(null);
    await expect(service.get('bob', 'board', 'carte')).rejects.toThrow(CardNotFoundError);
  });

  it('refuse tout à un non-membre, sans toucher aux cartes', async () => {
    boards.findMembership.mockResolvedValue(null);
    const attempts = [
      () => service.get('eve', 'board', 'carte'),
      () => service.create('eve', 'board', 'colonne', request),
      () => service.update('eve', 'board', 'carte', { ...request, description: '' }),
      () =>
        service.move('eve', 'board', 'carte', {
          columnId: 'colonne',
          previousCardId: null,
          nextCardId: null,
        }),
      () => service.delete('eve', 'board', 'carte'),
    ];
    for (const attempt of attempts) {
      await expect(attempt()).rejects.toThrow(BoardNotFoundError);
    }
    for (const method of Object.values(cards)) {
      expect(method).not.toHaveBeenCalled();
    }
  });
});
