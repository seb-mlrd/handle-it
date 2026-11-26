import type { CreationCursor } from '../shared/pagination/creation-cursor.js';
import type { Comment } from './comment.entity.js';

export interface CommentPage {
  readonly items: readonly Comment[];
  /** `null` quand il n'y a plus de commentaire plus récent. */
  readonly next: CreationCursor | null;
}
