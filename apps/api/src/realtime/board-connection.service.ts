import type { BoardAccessService } from '../board/board-access.service.js';
import type { BoardRepository } from '../board/board.repository.js';
import { DomainError } from '../shared/errors/domain.error.js';

/** Ce qu'une connexion doit savoir faire : entrer et sortir de la diffusion d'un board. */
export interface BoardSubscription {
  enter(boardId: string): Promise<void> | void;
  leave(boardId: string): Promise<void> | void;
}

/** Décide qui peut suivre un board en direct. */
export class BoardConnectionService {
  constructor(
    private readonly boardAccessService: BoardAccessService,
    private readonly boardRepository: BoardRepository,
  ) {}

  /** Renvoie la version du board suivi, ou `null` si l'accès est refusé. */
  async join(
    userId: string,
    boardId: string,
    subscription: BoardSubscription,
  ): Promise<number | null> {
    if (!(await this.canView(userId, boardId))) {
      return null;
    }
    await subscription.enter(boardId);
    // Vérifié à nouveau : un retrait entre le contrôle et l'entrée passerait sinon inaperçu.
    const isStillAllowed = await this.canView(userId, boardId);
    // Lue après l'entrée : aucune version ne peut tomber entre la lecture et la diffusion.
    const board = await this.boardRepository.findById(boardId);
    if (!isStillAllowed || !board) {
      await subscription.leave(boardId);
      return null;
    }
    return board.getVersion();
  }

  private async canView(userId: string, boardId: string): Promise<boolean> {
    try {
      await this.boardAccessService.authorize(userId, boardId, 'view-board');
      return true;
    } catch (error) {
      if (error instanceof DomainError) return false;
      throw error;
    }
  }
}
