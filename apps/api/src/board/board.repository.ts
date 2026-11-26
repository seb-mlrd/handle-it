import type { Board } from './board.entity.js';
import type { BoardWithRole } from './board-with-role.js';
import type { Membership } from './membership.entity.js';

export abstract class BoardRepository {
  /** Enregistre le board et l'appartenance de son créateur, ensemble ou pas du tout. */
  abstract add(board: Board, creator: Membership): Promise<void>;
  /** Renvoie les boards de l'utilisateur, du plus récent au plus ancien. */
  abstract findAllByUser(userId: string): Promise<BoardWithRole[]>;
  abstract findById(boardId: string): Promise<Board | null>;
  abstract findMembership(boardId: string, userId: string): Promise<Membership | null>;
  abstract addMember(membership: Membership): Promise<void>;
  /** Lève `BoardNotFoundError` si le board a disparu. */
  abstract update(board: Board): Promise<void>;
  abstract delete(boardId: string): Promise<void>;
}
