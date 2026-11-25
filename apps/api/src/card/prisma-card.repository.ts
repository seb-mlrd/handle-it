import type { UpdateCardRequest } from '@handle-it/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { ColumnNotFoundError } from '../column/errors/column-not-found.error.js';
import { isForeignKeyViolation, isUniqueViolation } from '../database/prisma-errors.js';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { RankConflictError } from '../shared/ranking/rank-conflict.error.js';
import { Rank } from '../shared/ranking/rank.value-object.js';
import type { RankedList } from '../shared/ranking/ranked-list.js';
import { Card } from './card.entity.js';
import { CardRepository } from './card.repository.js';
import type { CardSummary } from './card-summary.js';
import { PrismaCardList } from './prisma-card-list.js';
import { CardNotFoundError } from './errors/card-not-found.error.js';

const CARD_FIELDS = {
  id: true,
  columnId: true,
  title: true,
  description: true,
  rank: true,
} as const;

type CardRecord = Prisma.CardGetPayload<{ select: typeof CARD_FIELDS }>;

@Injectable()
export class PrismaCardRepository extends CardRepository {
  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {
    super();
  }

  override async add(card: Card): Promise<void> {
    try {
      await this.prismaService.card.create({
        data: {
          id: card.getId(),
          columnId: card.getColumnId(),
          title: card.getTitle(),
          description: card.getDescription(),
          rank: card.getRank().getValue(),
        },
        select: { id: true },
      });
    } catch (error) {
      throw this.translate(error);
    }
  }

  override findSummariesByBoard(boardId: string): Promise<CardSummary[]> {
    return this.prismaService.card.findMany({
      where: { column: { boardId } },
      orderBy: { rank: 'asc' },
      select: { id: true, columnId: true, title: true },
    });
  }

  override async find(boardId: string, cardId: string): Promise<Card | null> {
    const record = await this.prismaService.card.findFirst({
      where: this.onBoard(boardId, cardId),
      select: CARD_FIELDS,
    });
    return record && this.toCard(record);
  }

  override async areOnBoard(boardId: string, cardIds: readonly string[]): Promise<boolean> {
    const where = { id: { in: [...cardIds] }, column: { boardId } };
    return (await this.prismaService.card.count({ where })) === cardIds.length;
  }

  override getList(columnId: string): RankedList {
    return new PrismaCardList(this.prismaService, columnId);
  }

  override async move(
    boardId: string,
    cardId: string,
    columnId: string,
    rank: Rank,
  ): Promise<void> {
    const { count } = await this.updatePosition(boardId, cardId, columnId, rank);
    if (count === 0) {
      throw new CardNotFoundError();
    }
  }

  override async findLastRank(columnId: string): Promise<Rank | null> {
    const record = await this.prismaService.card.findFirst({
      where: { columnId },
      orderBy: { rank: 'desc' },
      select: { rank: true },
    });
    return record && Rank.fromValue(record.rank);
  }

  override async update(
    boardId: string,
    cardId: string,
    changes: UpdateCardRequest,
  ): Promise<Card> {
    const [record] = await this.prismaService.card.updateManyAndReturn({
      where: this.onBoard(boardId, cardId),
      data: { title: changes.title, description: changes.description },
      select: CARD_FIELDS,
    });
    if (!record) {
      throw new CardNotFoundError();
    }
    return this.toCard(record);
  }

  override async delete(boardId: string, cardId: string): Promise<void> {
    const { count } = await this.prismaService.card.deleteMany({
      where: this.onBoard(boardId, cardId),
    });
    if (count === 0) {
      throw new CardNotFoundError();
    }
  }

  private async updatePosition(boardId: string, cardId: string, columnId: string, rank: Rank) {
    try {
      return await this.prismaService.card.updateMany({
        where: this.onBoard(boardId, cardId),
        data: { columnId, rank: rank.getValue() },
      });
    } catch (error) {
      throw this.translate(error);
    }
  }

  private translate(error: unknown): unknown {
    if (isUniqueViolation(error)) return new RankConflictError();
    if (isForeignKeyViolation(error)) return new ColumnNotFoundError();
    return error;
  }

  private onBoard(boardId: string, cardId: string) {
    return { id: cardId, column: { boardId } };
  }

  private toCard(record: CardRecord): Card {
    const rank = Rank.fromValue(record.rank);
    return new Card(record.id, record.columnId, record.title, record.description, rank);
  }
}
