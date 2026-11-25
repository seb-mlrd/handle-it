import type { RankPlacement } from './rank-placement.js';
import { Rank } from './rank.value-object.js';
import type { RankedList } from './ranked-list.js';

const MAX_RANK_LENGTH = 32;

/** Calcule le rang d'arrivée d'un élément déplacé. */
export class RankPlacer {
  /** Rééquilibre la liste quand les insertions répétées ont trop allongé les rangs. */
  async place(list: RankedList, placement: RankPlacement): Promise<Rank> {
    const rank = await this.findRank(list, placement);
    if (rank.getValue().length <= MAX_RANK_LENGTH) {
      return rank;
    }
    await list.rebalance();
    return this.findRank(list, placement);
  }

  /**
   * La liste a pu changer depuis l'affichage du client : un seul voisin sert de repère, l'autre
   * est relu. Si les deux sont partis ailleurs, l'élément va à la fin.
   */
  private async findRank(list: RankedList, placement: RankPlacement): Promise<Rank> {
    const { itemId, previousItemId, nextItemId } = placement;
    const previousRank = previousItemId && (await list.findRank(previousItemId));
    if (previousRank) {
      return Rank.between(previousRank, await list.findNextRank(previousRank, itemId));
    }
    const nextRank = nextItemId && (await list.findRank(nextItemId));
    if (nextRank) {
      return Rank.between(await list.findPreviousRank(nextRank, itemId), nextRank);
    }
    return Rank.between(await list.findLastRank(itemId), null);
  }
}
