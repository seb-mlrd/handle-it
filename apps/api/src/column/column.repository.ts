import type { Rank } from '../shared/ranking/rank.value-object.js';
import type { RankedList } from '../shared/ranking/ranked-list.js';
import type { Column } from './column.entity.js';

/** Toute recherche est limitée à un board : une colonne d'un autre board reste hors d'atteinte. */
export abstract class ColumnRepository {
  /** Lève `RankConflictError` si le rang est pris, `BoardNotFoundError` si le board a disparu. */
  abstract add(column: Column): Promise<void>;
  abstract exists(boardId: string, columnId: string): Promise<boolean>;
  /** Renvoie les colonnes dans l'ordre de leur rang. */
  abstract findAllByBoard(boardId: string): Promise<Column[]>;
  /** Vérifie que toutes ces colonnes, sans doublon, sont sur le board. */
  abstract areOnBoard(boardId: string, columnIds: readonly string[]): Promise<boolean>;
  /** Donne accès à l'ordre des colonnes d'un board. */
  abstract getList(boardId: string): RankedList;
  /** Lève `RankConflictError` si le rang est pris, `ColumnNotFoundError` si la colonne n'est pas sur ce board. */
  abstract move(boardId: string, columnId: string, rank: Rank): Promise<void>;
  abstract findLastRank(boardId: string): Promise<Rank | null>;
  /** Renomme la colonne ; lève `ColumnNotFoundError` si elle n'est pas sur ce board. */
  abstract rename(boardId: string, columnId: string, name: string): Promise<Column>;
  /** Lève `ColumnNotFoundError` si la colonne n'est pas sur ce board. */
  abstract delete(boardId: string, columnId: string): Promise<void>;
}
