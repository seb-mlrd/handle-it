import { Inject, Injectable } from '@nestjs/common';
import { BoardNotFoundError } from '../board/errors/board-not-found.error.js';
import { isForeignKeyViolation, isUniqueViolation } from '../database/prisma-errors.js';
import { TransactionContext } from '../database/transaction-context.js';
import type { Prisma } from '../generated/prisma/client.js';
import { RankConflictError } from '../shared/ranking/rank-conflict.error.js';
import { Rank } from '../shared/ranking/rank.value-object.js';
import type { RankedList } from '../shared/ranking/ranked-list.js';
import { Column } from './column.entity.js';
import { ColumnRepository } from './column.repository.js';
import { PrismaColumnList } from './prisma-column-list.js';
import { ColumnNotFoundError } from './errors/column-not-found.error.js';

const COLUMN_FIELDS = { id: true, boardId: true, name: true, rank: true } as const;

type ColumnRecord = Prisma.ColumnGetPayload<{ select: typeof COLUMN_FIELDS }>;

@Injectable()
export class PrismaColumnRepository extends ColumnRepository {
  constructor(@Inject(TransactionContext) private readonly transactionContext: TransactionContext) {
    super();
  }

  override async add(column: Column): Promise<void> {
    try {
      await this.transactionContext.getClient().column.create({
        data: {
          id: column.getId(),
          boardId: column.getBoardId(),
          name: column.getName(),
          rank: column.getRank().getValue(),
        },
        select: { id: true },
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new RankConflictError();
      if (isForeignKeyViolation(error)) throw new BoardNotFoundError();
      throw error;
    }
  }

  override async exists(boardId: string, columnId: string): Promise<boolean> {
    return (
      (await this.transactionContext
        .getClient()
        .column.count({ where: { id: columnId, boardId } })) > 0
    );
  }

  override async findById(boardId: string, columnId: string): Promise<Column | null> {
    const record = await this.transactionContext.getClient().column.findFirst({
      where: { id: columnId, boardId },
      select: COLUMN_FIELDS,
    });
    return record && this.toColumn(record);
  }

  override async findAllByBoard(boardId: string): Promise<Column[]> {
    const records = await this.transactionContext.getClient().column.findMany({
      where: { boardId },
      orderBy: { rank: 'asc' },
      select: COLUMN_FIELDS,
    });
    return records.map((record) => this.toColumn(record));
  }

  override async areOnBoard(boardId: string, columnIds: readonly string[]): Promise<boolean> {
    const where = { id: { in: [...columnIds] }, boardId };
    return (await this.transactionContext.getClient().column.count({ where })) === columnIds.length;
  }

  override getList(boardId: string): RankedList {
    return new PrismaColumnList(this.transactionContext, boardId);
  }

  override async move(boardId: string, columnId: string, rank: Rank): Promise<void> {
    const { count } = await this.updateRank(boardId, columnId, rank);
    if (count === 0) {
      throw new ColumnNotFoundError();
    }
  }

  override async findLastRank(boardId: string): Promise<Rank | null> {
    const record = await this.transactionContext.getClient().column.findFirst({
      where: { boardId },
      orderBy: { rank: 'desc' },
      select: { rank: true },
    });
    return record && Rank.fromValue(record.rank);
  }

  override async rename(boardId: string, columnId: string, name: string): Promise<Column> {
    const [record] = await this.transactionContext.getClient().column.updateManyAndReturn({
      where: { id: columnId, boardId },
      data: { name },
      select: COLUMN_FIELDS,
    });
    if (!record) {
      throw new ColumnNotFoundError();
    }
    return this.toColumn(record);
  }

  override async delete(boardId: string, columnId: string): Promise<void> {
    const { count } = await this.transactionContext.getClient().column.deleteMany({
      where: { id: columnId, boardId },
    });
    if (count === 0) {
      throw new ColumnNotFoundError();
    }
  }

  private async updateRank(boardId: string, columnId: string, rank: Rank) {
    try {
      return await this.transactionContext.getClient().column.updateMany({
        where: { id: columnId, boardId },
        data: { rank: rank.getValue() },
      });
    } catch (error) {
      throw isUniqueViolation(error) ? new RankConflictError() : error;
    }
  }

  private toColumn(record: ColumnRecord): Column {
    return new Column(record.id, record.boardId, record.name, Rank.fromValue(record.rank));
  }
}
