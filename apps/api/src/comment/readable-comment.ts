import type { Comment } from './comment.entity.js';

/** Commentaire tel que le voit une personne, avec ce qu'elle a le droit d'en faire. */
export interface ReadableComment {
  readonly comment: Comment;
  readonly canEdit: boolean;
  readonly canDelete: boolean;
}

export interface ReadableCommentPage {
  readonly items: readonly ReadableComment[];
  readonly nextCursor: string | null;
}
