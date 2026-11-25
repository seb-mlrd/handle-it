import { randomUUID } from 'node:crypto';
import type { ColumnRequest, MoveColumnRequest } from '@handle-it/contracts';
import type { BoardAccessService } from '../board/board-access.service.js';
import { getNeighbourIds } from '../shared/ranking/get-neighbour-ids.js';
import type { RankPlacer } from '../shared/ranking/rank-placer.js';
import { Rank } from '../shared/ranking/rank.value-object.js';
import { retryOnRankConflict } from '../shared/ranking/retry-on-rank-conflict.js';
import { Column } from './column.entity.js';
import type { ColumnRepository } from './column.repository.js';
import { ColumnNotFoundError } from './errors/column-not-found.error.js';

/** Cycle de vie des colonnes d'un board. */
export class ColumnService {
  constructor(
    private readonly columnRepository: ColumnRepository,
    private readonly boardAccessService: BoardAccessService,
    private readonly rankPlacer: RankPlacer,
  ) {}

  /** Renvoie les colonnes dans leur ordre d'affichage. */
  async list(userId: string, boardId: string): Promise<Column[]> {
    await this.boardAccessService.authorize(userId, boardId, 'view-board');
    return this.columnRepository.findAllByBoard(boardId);
  }

  /** Ajoute une colonne à la fin du board. */
  async create(userId: string, boardId: string, request: ColumnRequest): Promise<Column> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    return retryOnRankConflict(async () => {
      const lastRank = await this.columnRepository.findLastRank(boardId);
      const rank = Rank.between(lastRank, null);
      const column = new Column(randomUUID(), boardId, request.name, rank);
      await this.columnRepository.add(column);
      return column;
    });
  }

  async rename(
    userId: string,
    boardId: string,
    columnId: string,
    request: ColumnRequest,
  ): Promise<Column> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    return this.columnRepository.rename(boardId, columnId, request.name);
  }

  /** Place une colonne entre deux voisines du même board. */
  async move(
    userId: string,
    boardId: string,
    columnId: string,
    request: MoveColumnRequest,
  ): Promise<void> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    const placement = {
      itemId: columnId,
      previousItemId: request.previousColumnId,
      nextItemId: request.nextColumnId,
    };
    const neighbourIds = getNeighbourIds(placement);
    if (!(await this.columnRepository.areOnBoard(boardId, [columnId, ...neighbourIds]))) {
      throw new ColumnNotFoundError();
    }
    const list = this.columnRepository.getList(boardId);
    await retryOnRankConflict(async () => {
      const rank = await this.rankPlacer.place(list, placement);
      await this.columnRepository.move(boardId, columnId, rank);
    });
  }

  async delete(userId: string, boardId: string, columnId: string): Promise<void> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    await this.columnRepository.delete(boardId, columnId);
  }
}
