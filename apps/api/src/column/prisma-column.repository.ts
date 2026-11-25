import { Inject, Injectable } from '@nestjs/common';
import { BoardNotFoundError } from '../board/errors/board-not-found.error.js';
import { isForeignKeyViolation, isUniqueViolation } from '../database/prisma-errors.js';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { RankConflictError } from '../shared/ranking/rank-conflict.error.js';
import { Rank } from '../shared/ranking/rank.value-object.js';
import { Column } from './column.entity.js';
import { ColumnRepository } from './column.repository.js';
import { ColumnNotFoundError } from './errors/column-not-found.error.js';

const COLUMN_FIELDS = { id: true, boardId: true, name: true, rank: true } as const;

type ColumnRecord = Prisma.ColumnGetPayload<{ select: typeof COLUMN_FIELDS }>;

@Injectable()
export class PrismaColumnRepository extends ColumnRepository {
  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {
    super();
  }

  override async add(column: Column): Promise<void> {
    try {
      await this.prismaService.column.create({
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
    return (await this.prismaService.column.count({ where: { id: columnId, boardId } })) > 0;
  }

  override async findAllByBoard(boardId: string): Promise<Column[]> {
    const records = await this.prismaService.column.findMany({
      where: { boardId },
      orderBy: { rank: 'asc' },
      select: COLUMN_FIELDS,
    });
    return records.map((record) => this.toColumn(record));
  }

  override async findLastRank(boardId: string): Promise<Rank | null> {
    const record = await this.prismaService.column.findFirst({
      where: { boardId },
      orderBy: { rank: 'desc' },
      select: { rank: true },
    });
    return record && Rank.fromValue(record.rank);
  }

  override async rename(boardId: string, columnId: string, name: string): Promise<Column> {
    const [record] = await this.prismaService.column.updateManyAndReturn({
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
    const { count } = await this.prismaService.column.deleteMany({
      where: { id: columnId, boardId },
    });
    if (count === 0) {
      throw new ColumnNotFoundError();
    }
  }

  private toColumn(record: ColumnRecord): Column {
    return new Column(record.id, record.boardId, record.name, Rank.fromValue(record.rank));
  }
}
