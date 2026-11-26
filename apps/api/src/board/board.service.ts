import { randomUUID } from 'node:crypto';
import type { BoardRequest } from '@handle-it/contracts';
import { Board } from './board.entity.js';
import type { BoardRepository } from './board.repository.js';
import type { BoardAccessService } from './board-access.service.js';
import type { BoardChanges } from './board-changes.js';
import type { BoardWithRole } from './board-with-role.js';
import { Membership } from './membership.entity.js';

/** Cycle de vie des boards, droits compris. */
export class BoardService {
  constructor(
    private readonly boardRepository: BoardRepository,
    private readonly boardAccessService: BoardAccessService,
    private readonly boardChanges: BoardChanges,
  ) {}

  /** Crée un board dont l'utilisateur devient l'owner. */
  async create(userId: string, request: BoardRequest): Promise<BoardWithRole> {
    const board = new Board(randomUUID(), request.name);
    const owner = new Membership(board.getId(), userId, 'owner');
    await this.boardRepository.add(board, owner);
    return { board, role: owner.getRole() };
  }

  /** Liste les boards dont l'utilisateur est membre. */
  list(userId: string): Promise<BoardWithRole[]> {
    return this.boardRepository.findAllByUser(userId);
  }

  async rename(userId: string, boardId: string, request: BoardRequest): Promise<BoardWithRole> {
    const membership = await this.boardAccessService.authorize(userId, boardId, 'rename-board');
    const board = new Board(boardId, request.name);
    return this.boardChanges.run(boardId, userId, async () => {
      await this.boardRepository.update(board);
      return {
        result: { board, role: membership.getRole() },
        event: { type: 'board-renamed', name: request.name },
        activity: { cardId: null, details: { type: 'board-renamed', boardName: request.name } },
      };
    });
  }

  async delete(userId: string, boardId: string): Promise<void> {
    await this.boardAccessService.authorize(userId, boardId, 'delete-board');
    // L'historique part avec le board : rien à y inscrire.
    await this.boardChanges.run(boardId, userId, async () => {
      await this.boardRepository.delete(boardId);
      return { result: undefined, event: { type: 'board-deleted' }, activity: null };
    });
  }
}
