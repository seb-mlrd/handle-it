import { beforeEach, expect, it, vi } from 'vitest';
import { BoardAccessPolicy } from '../board/board-access-policy.js';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardActionForbiddenError } from '../board/errors/board-action-forbidden.error.js';
import { BoardNotFoundError } from '../board/errors/board-not-found.error.js';
import { Membership } from '../board/membership.entity.js';
import { createBoardRepository, InMemoryBoardChanges } from '../testing/repositories.js';
import { MemberService } from './member.service.js';

const boards = createBoardRepository();
const members = {
  findAllByBoard: vi.fn(),
  findDisplayName: vi.fn(),
  expel: vi.fn(),
  remove: vi.fn(),
};
const publisher = { publish: vi.fn(), evict: vi.fn() };
const service = new MemberService(
  members,
  new BoardAccessService(boards, new BoardAccessPolicy()),
  new InMemoryBoardChanges(),
  publisher,
);

beforeEach(() => {
  vi.resetAllMocks();
});

it("laisse l'owner retirer un membre, mais pas quitter son board", async () => {
  boards.findMembership.mockResolvedValue(new Membership('board', 'ada', 'owner'));
  members.findDisplayName.mockResolvedValue('Bob');
  await service.remove('ada', 'board', 'bob');
  expect(members.expel).toHaveBeenCalledWith('board', 'bob');
  expect(publisher.evict).toHaveBeenCalledExactlyOnceWith('board', 'bob');
  await expect(service.leave('ada', 'board')).rejects.toThrow(BoardActionForbiddenError);
});

it('laisse un membre quitter le board, mais pas en retirer un autre', async () => {
  boards.findMembership.mockResolvedValue(new Membership('board', 'bob', 'member'));
  await service.leave('bob', 'board');
  expect(members.remove).toHaveBeenCalledExactlyOnceWith('board', 'bob');
  await expect(service.remove('bob', 'board', 'eve')).rejects.toThrow(BoardActionForbiddenError);
});

it('cache tout à un non-membre', async () => {
  boards.findMembership.mockResolvedValue(null);
  await expect(service.list('eve', 'board')).rejects.toThrow(BoardNotFoundError);
  await expect(service.remove('eve', 'board', 'bob')).rejects.toThrow(BoardNotFoundError);
  await expect(service.leave('eve', 'board')).rejects.toThrow(BoardNotFoundError);
});
