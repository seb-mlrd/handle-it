import type { ActivityCursor } from './activity-cursor.js';
import type { Activity } from './activity.entity.js';

export interface ActivityPage {
  readonly items: readonly Activity[];
  /** `null` quand il n'y a plus d'entrée plus ancienne. */
  readonly next: ActivityCursor | null;
}
