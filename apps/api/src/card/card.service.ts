import { randomUUID } from 'node:crypto';
import type { CreateCardRequest, MoveCardRequest, UpdateCardRequest } from '@handle-it/contracts';
import type { BoardAccessService } from '../board/board-access.service.js';
import type { ColumnRepository } from '../column/column.repository.js';
import { ColumnNotFoundError } from '../column/errors/column-not-found.error.js';
import { getNeighbourIds } from '../shared/ranking/get-neighbour-ids.js';
import type { RankPlacer } from '../shared/ranking/rank-placer.js';
import { Rank } from '../shared/ranking/rank.value-object.js';
import { retryOnRankConflict } from '../shared/ranking/retry-on-rank-conflict.js';
import { Card } from './card.entity.js';
import type { CardRepository } from './card.repository.js';
import { CardNotFoundError } from './errors/card-not-found.error.js';

const EMPTY_DESCRIPTION = '';

/** Cycle de vie des cartes d'un board. */
export class CardService {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly columnRepository: ColumnRepository,
    private readonly boardAccessService: BoardAccessService,
    private readonly rankPlacer: RankPlacer,
  ) {}

  /** Renvoie une carte avec sa description. */
  async get(userId: string, boardId: string, cardId: string): Promise<Card> {
    await this.boardAccessService.authorize(userId, boardId, 'view-board');
    const card = await this.cardRepository.find(boardId, cardId);
    if (!card) {
      throw new CardNotFoundError();
    }
    return card;
  }

  /** Ajoute une carte à la fin d'une colonne. */
  async create(
    userId: string,
    boardId: string,
    columnId: string,
    request: CreateCardRequest,
  ): Promise<Card> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    if (!(await this.columnRepository.exists(boardId, columnId))) {
      throw new ColumnNotFoundError();
    }
    return retryOnRankConflict(async () => {
      const rank = Rank.between(await this.cardRepository.findLastRank(columnId), null);
      const card = new Card(randomUUID(), columnId, request.title, EMPTY_DESCRIPTION, rank);
      await this.cardRepository.add(card);
      return card;
    });
  }

  async update(
    userId: string,
    boardId: string,
    cardId: string,
    request: UpdateCardRequest,
  ): Promise<Card> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    return this.cardRepository.update(boardId, cardId, request);
  }

  /** Place une carte entre deux voisines, dans sa colonne ou une autre du même board. */
  async move(
    userId: string,
    boardId: string,
    cardId: string,
    request: MoveCardRequest,
  ): Promise<void> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    const placement = {
      itemId: cardId,
      previousItemId: request.previousCardId,
      nextItemId: request.nextCardId,
    };
    const neighbourIds = getNeighbourIds(placement);
    if (!(await this.columnRepository.exists(boardId, request.columnId))) {
      throw new ColumnNotFoundError();
    }
    if (!(await this.cardRepository.areOnBoard(boardId, [cardId, ...neighbourIds]))) {
      throw new CardNotFoundError();
    }
    const list = this.cardRepository.getList(request.columnId);
    await retryOnRankConflict(async () => {
      const rank = await this.rankPlacer.place(list, placement);
      await this.cardRepository.move(boardId, cardId, request.columnId, rank);
    });
  }

  async delete(userId: string, boardId: string, cardId: string): Promise<void> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    await this.cardRepository.delete(boardId, cardId);
  }
}
