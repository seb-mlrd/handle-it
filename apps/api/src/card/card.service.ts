import { randomUUID } from 'node:crypto';
import type { CreateCardRequest, MoveCardRequest, UpdateCardRequest } from '@handle-it/contracts';
import type { BoardChanges } from '../board/board-changes.js';
import type { BoardAccessService } from '../board/board-access.service.js';
import type { ColumnRepository } from '../column/column.repository.js';
import { ColumnNotFoundError } from '../column/errors/column-not-found.error.js';
import { getNeighbourIds } from '../shared/ranking/get-neighbour-ids.js';
import type { RankPlacer } from '../shared/ranking/rank-placer.js';
import { Rank } from '../shared/ranking/rank.value-object.js';
import { retryOnRankConflict } from '../shared/ranking/retry-on-rank-conflict.js';
import { presentCardSummary } from './card.presenter.js';
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
    private readonly boardChanges: BoardChanges,
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
    return retryOnRankConflict(() =>
      this.boardChanges.run(boardId, async () => {
        if (!(await this.columnRepository.exists(boardId, columnId))) {
          throw new ColumnNotFoundError();
        }
        const rank = Rank.between(await this.cardRepository.findLastRank(columnId), null);
        const card = new Card(randomUUID(), columnId, request.title, EMPTY_DESCRIPTION, rank);
        await this.cardRepository.add(card);
        return {
          result: card,
          event: { type: 'card-created', columnId, card: presentCardSummary(card) },
        };
      }),
    );
  }

  async update(
    userId: string,
    boardId: string,
    cardId: string,
    request: UpdateCardRequest,
  ): Promise<Card> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    return this.boardChanges.run(boardId, async () => {
      const card = await this.cardRepository.update(boardId, cardId, request);
      return { result: card, event: { type: 'card-updated', card: presentCardSummary(card) } };
    });
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
    const { columnId } = request;
    await retryOnRankConflict(() =>
      this.boardChanges.run(boardId, async () => {
        await this.assertOnBoard(boardId, columnId, [cardId, ...neighbourIds]);
        const list = this.cardRepository.getList(columnId);
        const rank = await this.rankPlacer.place(list, placement);
        await this.cardRepository.move(boardId, cardId, columnId, rank);
        const previousCardId = await list.findPreviousId(rank, cardId);
        return {
          result: undefined,
          event: { type: 'card-moved', cardId, columnId, previousCardId },
        };
      }),
    );
  }

  async delete(userId: string, boardId: string, cardId: string): Promise<void> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    await this.boardChanges.run(boardId, async () => {
      await this.cardRepository.delete(boardId, cardId);
      return { result: undefined, event: { type: 'card-deleted', cardId } };
    });
  }

  private async assertOnBoard(
    boardId: string,
    columnId: string,
    cardIds: readonly string[],
  ): Promise<void> {
    if (!(await this.columnRepository.exists(boardId, columnId))) {
      throw new ColumnNotFoundError();
    }
    if (!(await this.cardRepository.areOnBoard(boardId, cardIds))) {
      throw new CardNotFoundError();
    }
  }
}
