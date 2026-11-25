import { RankConflictError } from './rank-conflict.error.js';

const MAX_ATTEMPTS = 10;

/** Rejoue une écriture dont le rang vient d'être pris ; abandonne après quelques essais. */
export async function retryOnRankConflict<Result>(write: () => Promise<Result>): Promise<Result> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await write();
    } catch (error) {
      if (!(error instanceof RankConflictError) || attempt === MAX_ATTEMPTS) {
        throw error;
      }
    }
  }
}
