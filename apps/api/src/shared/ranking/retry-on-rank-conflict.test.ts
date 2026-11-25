import { describe, expect, it, vi } from 'vitest';
import { RankConflictError } from './rank-conflict.error.js';
import { retryOnRankConflict } from './retry-on-rank-conflict.js';

describe('retryOnRankConflict', () => {
  it('réessaie après un conflit', async () => {
    const write = vi.fn().mockRejectedValueOnce(new RankConflictError()).mockResolvedValue('ok');
    expect(await retryOnRankConflict(write)).toBe('ok');
    expect(write).toHaveBeenCalledTimes(2);
  });

  it('abandonne après dix essais', async () => {
    const write = vi.fn().mockRejectedValue(new RankConflictError());
    await expect(retryOnRankConflict(write)).rejects.toThrow(RankConflictError);
    expect(write).toHaveBeenCalledTimes(10);
  });

  it('ne rejoue pas une autre erreur', async () => {
    const write = vi.fn().mockRejectedValue(new Error('panne'));
    await expect(retryOnRankConflict(write)).rejects.toThrow('panne');
    expect(write).toHaveBeenCalledOnce();
  });
});
