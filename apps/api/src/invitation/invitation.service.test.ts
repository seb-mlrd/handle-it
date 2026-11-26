import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Board } from '../board/board.entity.js';
import { BoardAccessPolicy } from '../board/board-access-policy.js';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardActionForbiddenError } from '../board/errors/board-action-forbidden.error.js';
import { Membership } from '../board/membership.entity.js';
import { createBoardRepository, InMemoryBoardChanges } from '../testing/repositories.js';
import { InvitationInvalidError } from './errors/invitation-invalid.error.js';
import { Invitation } from './invitation.entity.js';
import { InvitationService } from './invitation.service.js';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-01-01T00:00:00.000Z');
const inDays = (days: number) => new Date(NOW.getTime() + days * DAY_MILLISECONDS);

const boards = createBoardRepository();
const invitations = {
  add: vi.fn(),
  findByTokenHash: vi.fn(),
  findActiveByBoard: vi.fn(),
  consume: vi.fn(),
  deleteExpired: vi.fn(),
};
const tokens = { generate: () => 'jeton', hash: (token: string) => `sha:${token}` };
const service = new InvitationService(
  invitations,
  boards,
  new BoardAccessService(boards, new BoardAccessPolicy()),
  tokens,
  { now: () => NOW },
  new InMemoryBoardChanges(),
);
const valid = new Invitation('invitation', 'board', 'sha:jeton', inDays(1));

beforeEach(() => {
  vi.resetAllMocks();
  boards.findById.mockResolvedValue(new Board('board', 'Maison'));
});

describe('côté owner', () => {
  it.each([
    ['one-hour', inDays(1 / 24)],
    ['one-day', inDays(1)],
    ['seven-days', inDays(7)],
  ] as const)('crée un lien %s dont seule l’empreinte est stockée', async (duration, expiresAt) => {
    boards.findMembership.mockResolvedValue(new Membership('board', 'ada', 'owner'));
    const { invitation, token } = await service.create('ada', 'board', { duration });
    expect(token).toBe('jeton');
    expect(invitation.getTokenHash()).toBe('sha:jeton');
    expect(invitation.getExpiresAt()).toEqual(expiresAt);
    expect(invitations.add).toHaveBeenCalledWith(invitation);
  });

  it('est interdit à un membre', async () => {
    boards.findMembership.mockResolvedValue(new Membership('board', 'bob', 'member'));
    for (const attempt of [
      () => service.create('bob', 'board', { duration: 'one-day' }),
      () => service.list('bob', 'board'),
    ]) {
      await expect(attempt()).rejects.toThrow(BoardActionForbiddenError);
    }
    expect(invitations.add).not.toHaveBeenCalled();
  });
});

describe('côté invité', () => {
  it('rejoint le board comme simple membre', async () => {
    invitations.findByTokenHash.mockResolvedValue(valid);
    boards.findMembership.mockResolvedValue(null);
    const { role } = await service.accept('bob', 'jeton');
    expect(role).toBe('member');
    const member = new Membership('board', 'bob', 'member');
    expect(invitations.consume).toHaveBeenCalledWith(valid);
    expect(boards.addMember).toHaveBeenCalledWith(member);
  });

  it('ne consomme rien et ne rétrograde pas un owner qui ouvre son propre lien', async () => {
    invitations.findByTokenHash.mockResolvedValue(valid);
    boards.findMembership.mockResolvedValue(new Membership('board', 'ada', 'owner'));
    expect((await service.accept('ada', 'jeton')).role).toBe('owner');
    expect(invitations.consume).not.toHaveBeenCalled();
  });

  it.each([
    ['inconnue', null],
    ['expirée', new Invitation('invitation', 'board', 'sha:jeton', NOW)],
  ])('refuse une invitation %s', async (_case, invitation) => {
    invitations.findByTokenHash.mockResolvedValue(invitation);
    await expect(service.preview('jeton')).rejects.toThrow(InvitationInvalidError);
    await expect(service.accept('bob', 'jeton')).rejects.toThrow(InvitationInvalidError);
    expect(invitations.consume).not.toHaveBeenCalled();
  });

  it('refuse une invitation dont le board a disparu', async () => {
    invitations.findByTokenHash.mockResolvedValue(valid);
    boards.findById.mockResolvedValue(null);
    await expect(service.preview('jeton')).rejects.toThrow(InvitationInvalidError);
  });
});
