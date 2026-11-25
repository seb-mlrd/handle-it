import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardAccessPolicy } from './board-access-policy.js';
import { BoardAccessService } from './board-access.service.js';
import { BoardService } from './board.service.js';
import { BoardActionForbiddenError } from './errors/board-action-forbidden.error.js';
import { BoardNotFoundError } from './errors/board-not-found.error.js';
import { Membership } from './membership.entity.js';
import { createBoardRepository } from '../testing/repositories.js';

const repository = createBoardRepository();
const service = new BoardService(
  repository,
  new BoardAccessService(repository, new BoardAccessPolicy()),
);

beforeEach(() => {
  vi.resetAllMocks();
});

describe('BoardService', () => {
  it("fait du créateur l'owner du board", async () => {
    const { board, role } = await service.create('ada', { name: 'Maison' });
    const creator = new Membership(board.getId(), 'ada', 'owner');
    expect(role).toBe('owner');
    expect(repository.add).toHaveBeenCalledWith(board, creator);
  });

  it("laisse l'owner renommer et supprimer", async () => {
    repository.findMembership.mockResolvedValue(new Membership('board', 'ada', 'owner'));
    const { board } = await service.rename('ada', 'board', { name: 'Travail' });
    await service.delete('ada', 'board');
    expect(board.getName()).toBe('Travail');
    expect(repository.update).toHaveBeenCalledWith(board);
    expect(repository.delete).toHaveBeenCalledWith('board');
  });

  it.each([
    ['un membre', new Membership('board', 'bob', 'member'), BoardActionForbiddenError],
    ['un non-membre', null, BoardNotFoundError],
  ])("n'écrit rien pour %s", async (_case, membership, error) => {
    repository.findMembership.mockResolvedValue(membership);
    await expect(service.rename('bob', 'board', { name: 'Travail' })).rejects.toThrow(error);
    await expect(service.delete('bob', 'board')).rejects.toThrow(error);
    expect(repository.update).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
