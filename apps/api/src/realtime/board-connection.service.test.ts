import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Board } from '../board/board.entity.js';
import { BoardAccessPolicy } from '../board/board-access-policy.js';
import { BoardAccessService } from '../board/board-access.service.js';
import { Membership } from '../board/membership.entity.js';
import { createBoardRepository } from '../testing/repositories.js';
import { BoardConnectionService } from './board-connection.service.js';

const boards = createBoardRepository();
const access = new BoardAccessService(boards, new BoardAccessPolicy());
const service = new BoardConnectionService(access, boards);
const subscription = { enter: vi.fn(), leave: vi.fn() };
const membership = new Membership('board', 'bob', 'member');

beforeEach(() => {
  vi.resetAllMocks();
  boards.findById.mockResolvedValue(new Board('board', 'Maison', 7));
});

describe('BoardConnectionService', () => {
  it('fait entrer un membre et renvoie la version', async () => {
    boards.findMembership.mockResolvedValue(membership);
    expect(await service.join('bob', 'board', subscription)).toBe(7);
    expect(subscription.leave).not.toHaveBeenCalled();
  });

  it('ne laisse jamais entrer un non-membre', async () => {
    boards.findMembership.mockResolvedValue(null);
    expect(await service.join('eve', 'board', subscription)).toBeNull();
    expect(subscription.enter).not.toHaveBeenCalled();
  });

  it('fait ressortir un membre retiré pendant son entrée', async () => {
    boards.findMembership.mockResolvedValueOnce(membership).mockResolvedValueOnce(null);
    expect(await service.join('bob', 'board', subscription)).toBeNull();
    expect(subscription.leave).toHaveBeenCalledWith('board');
  });

  it('propage une panne au lieu de la prendre pour un refus', async () => {
    boards.findMembership.mockRejectedValue(new Error('panne'));
    await expect(service.join('bob', 'board', subscription)).rejects.toThrow('panne');
  });
});
