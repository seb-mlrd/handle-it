import type { BoardRole } from '@handle-it/contracts';
import { BoardActionForbiddenError } from './errors/board-action-forbidden.error.js';
import { BoardNotFoundError } from './errors/board-not-found.error.js';
import type { Membership } from './membership.entity.js';

export type BoardAction = 'rename-board' | 'delete-board';

const ROLES_BY_ACTION: Record<BoardAction, readonly BoardRole[]> = {
  'rename-board': ['owner'],
  'delete-board': ['owner'],
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
