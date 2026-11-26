import type { BoardEvent } from '@handle-it/contracts';
import type { ActivityEntry } from '../activity/activity-entry.js';

/** Résultat d'une modification et événement qui la décrit aux autres membres. */
export interface BoardChange<Result> {
  readonly result: Result;
  readonly event: BoardEvent;
  /** `null` pour ce qui n'a plus d'historique où s'inscrire, comme la suppression du board. */
  readonly activity: ActivityEntry | null;
}

/** Point de passage de toute modification d'un board. */
export abstract class BoardChanges {
  /**
   * Exécute la modification seule sur ce board, dans une transaction qui incrémente sa version et
   * inscrit l'historique au nom de `actorId`, puis publie l'événement une fois la transaction validée. Lève `BoardNotFoundError` si le board a
   * disparu.
   */
  abstract run<Result>(
    boardId: string,
    actorId: string,
    change: () => Promise<BoardChange<Result>>,
  ): Promise<Result>;
  /** Lit plusieurs données du board dans un même état. */
  abstract readConsistently<Result>(read: () => Promise<Result>): Promise<Result>;
}
