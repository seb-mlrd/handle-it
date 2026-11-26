import type { BoardRole } from '@handle-it/contracts';
import { BoardActionForbiddenError } from './errors/board-action-forbidden.error.js';
import { BoardNotFoundError } from './errors/board-not-found.error.js';
import type { Membership } from './membership.entity.js';

export type BoardAction =
  | 'view-board'
  | 'edit-content'
  | 'rename-board'
  | 'delete-board'
  | 'manage-members'
  | 'leave-board'
  | 'comment';

/** Actions sur un commentaire déjà écrit : elles dépendent aussi de qui l'a écrit. */
export type CommentAction = 'edit-comment' | 'delete-comment';

const ROLES_BY_ACTION: Record<BoardAction, readonly BoardRole[]> = {
  'view-board': ['owner', 'member'],
  // Colonnes et cartes : tout membre les gère.
  'edit-content': ['owner', 'member'],
  'rename-board': ['owner'],
  'delete-board': ['owner'],
  'manage-members': ['owner'],
  // Sans transfert de propriété, un board ne doit pas perdre son owner.
  'leave-board': ['member'],
  comment: ['owner', 'member'],
};

/** Rôles autorisés en plus de l'auteur, qui peut toujours agir sur ses propres commentaires. */
const ROLES_BY_COMMENT_ACTION: Record<CommentAction, readonly BoardRole[]> = {
  // Personne ne fait dire à un autre ce qu'il n'a pas écrit.
  'edit-comment': [],
  // L'owner modère son board.
  'delete-comment': ['owner'],
};

/** Seul endroit qui décide de ce qu'un rôle permet sur un board. */
export class BoardAccessPolicy {
  /** Lève une erreur si l'action est interdite, sinon renvoie l'appartenance vérifiée. */
  authorize(membership: Membership | null, action: BoardAction): Membership {
    if (!membership) {
      throw new BoardNotFoundError();
    }
    if (!ROLES_BY_ACTION[action].includes(membership.getRole())) {
      throw new BoardActionForbiddenError();
    }
    return membership;
  }

  /** Lève `BoardActionForbiddenError` si l'action sur ce commentaire est interdite. */
  authorizeOnComment(membership: Membership, action: CommentAction, isAuthor: boolean): void {
    if (!this.isAllowedOnComment(membership, action, isAuthor)) {
      throw new BoardActionForbiddenError();
    }
  }

  /** Dit si l'action sur ce commentaire est permise, pour l'annoncer au client. */
  isAllowedOnComment(membership: Membership, action: CommentAction, isAuthor: boolean): boolean {
    return isAuthor || ROLES_BY_COMMENT_ACTION[action].includes(membership.getRole());
  }
}
