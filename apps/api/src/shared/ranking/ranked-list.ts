import type { Rank } from './rank.value-object.js';

/** Liste ordonnée par rang : les cartes d'une colonne ou les colonnes d'un board. */
export abstract class RankedList {
  /** Renvoie `null` si l'élément n'est pas (ou plus) dans cette liste. */
  abstract findRank(itemId: string): Promise<Rank | null>;
  /** Rang qui suit immédiatement, sans tenir compte de l'élément déplacé. */
  abstract findNextRank(rank: Rank, movedItemId: string): Promise<Rank | null>;
  /** Rang qui précède immédiatement, sans tenir compte de l'élément déplacé. */
  abstract findPreviousRank(rank: Rank, movedItemId: string): Promise<Rank | null>;
  /** Dernier rang, sans tenir compte de l'élément déplacé. */
  abstract findLastRank(movedItemId: string): Promise<Rank | null>;
  /** Redonne des rangs courts à toute la liste, sans changer son ordre. */
  abstract rebalance(): Promise<void>;
}
