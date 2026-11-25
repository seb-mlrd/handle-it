import { vi } from 'vitest';

/** Doublures de repositories partagées par les tests unitaires. */
export const createBoardRepository = () => ({
  add: vi.fn(),
  findAllByUser: vi.fn(),
  findById: vi.fn(),
  findMembership: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

export const createColumnRepository = () => ({
  add: vi.fn(),
  exists: vi.fn(),
  findAllByBoard: vi.fn(),
  findLastRank: vi.fn(),
  rename: vi.fn(),
  delete: vi.fn(),
});
