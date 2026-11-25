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
  | 'leave-board';

const ROLES_BY_ACTION: Record<BoardAction, readonly BoardRole[]> = {
  'view-board': ['owner', 'member'],
  // Colonnes et cartes : tout membre les gère.
  'edit-content': ['owner', 'member'],
  'rename-board': ['owner'],
  'delete-board': ['owner'],
  'manage-members': ['owner'],
  // Sans transfert de propriété, un board ne doit pas perdre son owner.
  'leave-board': ['member'],
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
}
