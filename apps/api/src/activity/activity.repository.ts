import type { CreationCursor } from '../shared/pagination/creation-cursor.js';
import type { ActivityEntry } from './activity-entry.js';
import type { ActivityPage } from './activity-page.js';

export interface ActivityQuery {
  readonly boardId: string;
  /** Limite l'historique à une carte. */
  readonly cardId: string | null;
  readonly before: CreationCursor | null;
  readonly limit: number;
}

export abstract class ActivityRepository {
  /** Écrit l'entrée ; à appeler dans la modification du board qu'elle décrit. */
  abstract add(boardId: string, actorId: string, entry: ActivityEntry): Promise<void>;
  /** Renvoie les entrées de la plus récente à la plus ancienne. */
  abstract findPage(query: ActivityQuery): Promise<ActivityPage>;
}
