import type { CreationCursor } from '../shared/pagination/creation-cursor.js';
import type { CommentPage } from './comment-page.js';
import type { Comment } from './comment.entity.js';

export interface CommentQuery {
  readonly boardId: string;
  readonly cardId: string;
  readonly after: CreationCursor | null;
  readonly limit: number;
}

/** Toute lecture est limitée à un board : un commentaire d'un autre board reste hors d'atteinte. */
export abstract class CommentRepository {
  abstract add(comment: Comment): Promise<void>;
  abstract findById(boardId: string, commentId: string): Promise<Comment | null>;
  /** Renvoie les commentaires d'une carte, du plus ancien au plus récent. */
  abstract findPage(query: CommentQuery): Promise<CommentPage>;
  /** Enregistre le texte et la date de modification ; lève `CommentNotFoundError`. */
  abstract update(comment: Comment): Promise<void>;
  /** Lève `CommentNotFoundError`. */
  abstract delete(commentId: string): Promise<void>;
  abstract countOnCard(cardId: string): Promise<number>;
  /** Nombre de commentaires de chaque carte du board qui en a au moins un. */
  abstract countByBoard(boardId: string): Promise<Map<string, number>>;
}
