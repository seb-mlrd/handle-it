import { Rank } from './rank.value-object.js';

/** Suite de rangs courts, tous après le dernier : aucun ne heurte un rang encore en place. */
export function createFreshRanks(count: number, lastRank: Rank | null): Rank[] {
  const ranks: Rank[] = [];
  let previous = lastRank;
  for (let index = 0; index < count; index += 1) {
    previous = Rank.between(previous, null);
    ranks.push(previous);
  }
  return ranks;
}
