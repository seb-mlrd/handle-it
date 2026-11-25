import type { Rank } from '../shared/ranking/rank.value-object.js';
import type { Column } from './column.entity.js';

/** Toute recherche est limitée à un board : une colonne d'un autre board reste hors d'atteinte. */
export abstract class ColumnRepository {
  /** Lève `RankConflictError` si le rang est pris, `BoardNotFoundError` si le board a disparu. */
  abstract add(column: Column): Promise<void>;
  abstract exists(boardId: string, columnId: string): Promise<boolean>;
  /** Renvoie les colonnes dans l'ordre de leur rang. */
  abstract findAllByBoard(boardId: string): Promise<Column[]>;
  abstract findLastRank(boardId: string): Promise<Rank | null>;
  /** Renomme la colonne ; lève `ColumnNotFoundError` si elle n'est pas sur ce board. */
  abstract rename(boardId: string, columnId: string, name: string): Promise<Column>;
  /** Lève `ColumnNotFoundError` si la colonne n'est pas sur ce board. */
  abstract delete(boardId: string, columnId: string): Promise<void>;
}
