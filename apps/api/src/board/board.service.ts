import { randomUUID } from 'node:crypto';
import type { BoardRequest } from '@handle-it/contracts';
import { Board } from './board.entity.js';
import type { BoardRepository } from './board.repository.js';
import type { BoardAccessService } from './board-access.service.js';
import type { BoardWithRole } from './board-with-role.js';
import { Membership } from './membership.entity.js';

/** Cycle de vie des boards, droits compris. */
export class BoardService {
  constructor(
    private readonly boardRepository: BoardRepository,
    private readonly boardAccessService: BoardAccessService,
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
    await this.boardRepository.update(board);
    return { board, role: membership.getRole() };
  }

  async delete(userId: string, boardId: string): Promise<void> {
    await this.boardAccessService.authorize(userId, boardId, 'delete-board');
    await this.boardRepository.delete(boardId);
  }
}
