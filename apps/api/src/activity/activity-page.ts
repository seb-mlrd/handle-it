import type { CreationCursor } from '../shared/pagination/creation-cursor.js';
import type { Activity } from './activity.entity.js';

export interface ActivityPage {
  readonly items: readonly Activity[];
  /** `null` quand il n'y a plus d'entrée plus ancienne. */
  readonly next: CreationCursor | null;
}
