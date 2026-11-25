import type { BoardRepository } from './board.repository.js';
import type { BoardAccessPolicy, BoardAction } from './board-access-policy.js';
import type { Membership } from './membership.entity.js';

/** Vérifie les droits d'un utilisateur sur un board, pour tous les domaines qui en dépendent. */
export class BoardAccessService {
  constructor(
    private readonly boardRepository: BoardRepository,
    private readonly boardAccessPolicy: BoardAccessPolicy,
  ) {}

  /** Lève une erreur si l'action est interdite. */
  async authorize(userId: string, boardId: string, action: BoardAction): Promise<Membership> {
    const membership = await this.boardRepository.findMembership(boardId, userId);
    return this.boardAccessPolicy.authorize(membership, action);
  }
}
