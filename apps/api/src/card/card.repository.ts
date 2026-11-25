import type { UpdateCardRequest } from '@handle-it/contracts';
import type { Rank } from '../shared/ranking/rank.value-object.js';
import type { RankedList } from '../shared/ranking/ranked-list.js';
import type { Card } from './card.entity.js';
import type { CardSummary } from './card-summary.js';

/** Toute recherche est limitée à un board : une carte d'un autre board reste hors d'atteinte. */
export abstract class CardRepository {
  /** Lève `RankConflictError` si le rang est pris, `ColumnNotFoundError` si la colonne a disparu. */
  abstract add(card: Card): Promise<void>;
  /** Renvoie les cartes du board, triées par rang dans chaque colonne. */
  abstract findSummariesByBoard(boardId: string): Promise<CardSummary[]>;
  abstract find(boardId: string, cardId: string): Promise<Card | null>;
  /** Vérifie que toutes ces cartes, sans doublon, sont sur le board. */
  abstract areOnBoard(boardId: string, cardIds: readonly string[]): Promise<boolean>;
  /** Donne accès à l'ordre des cartes d'une colonne. */
  abstract getList(columnId: string): RankedList;
  /**
   * Lève `RankConflictError` si le rang est pris, `CardNotFoundError` si la carte n'est pas sur ce
   * board, `ColumnNotFoundError` si la colonne a disparu.
   */
  abstract move(boardId: string, cardId: string, columnId: string, rank: Rank): Promise<void>;
  abstract findLastRank(columnId: string): Promise<Rank | null>;
  /** Lève `CardNotFoundError` si la carte n'est pas sur ce board. */
  abstract update(boardId: string, cardId: string, changes: UpdateCardRequest): Promise<Card>;
  /** Lève `CardNotFoundError` si la carte n'est pas sur ce board. */
  abstract delete(boardId: string, cardId: string): Promise<void>;
}
