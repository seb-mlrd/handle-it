import { InvalidPlacementError } from './invalid-placement.error.js';
import type { RankPlacement } from './rank-placement.js';

/** Renvoie les voisins nommés, sans doublon ; refuse qu'un élément soit son propre voisin. */
export function getNeighbourIds(placement: RankPlacement): string[] {
  const neighbourIds = [placement.previousItemId, placement.nextItemId].filter((id) => id !== null);
  if (neighbourIds.includes(placement.itemId)) {
    throw new InvalidPlacementError();
  }
  return [...new Set(neighbourIds)];
}
