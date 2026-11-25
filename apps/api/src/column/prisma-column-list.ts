import type { PrismaService } from '../database/prisma.service.js';
import { createFreshRanks } from '../shared/ranking/create-fresh-ranks.js';
import { Rank } from '../shared/ranking/rank.value-object.js';
import { RankedList } from '../shared/ranking/ranked-list.js';

/** Colonnes d'un board, vues comme une liste ordonnée. */
export class PrismaColumnList extends RankedList {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly boardId: string,
  ) {
    super();
  }

  override async findRank(columnId: string): Promise<Rank | null> {
    return this.toRank(
      await this.prismaService.column.findFirst({
        where: { id: columnId, boardId: this.boardId },
        select: { rank: true },
      }),
    );
  }

  override async findNextRank(rank: Rank, movedColumnId: string): Promise<Rank | null> {
    return this.toRank(
      await this.prismaService.column.findFirst({
        where: { ...this.without(movedColumnId), rank: { gt: rank.getValue() } },
        orderBy: { rank: 'asc' },
        select: { rank: true },
      }),
    );
  }

  override async findPreviousRank(rank: Rank, movedColumnId: string): Promise<Rank | null> {
    return this.toRank(
      await this.prismaService.column.findFirst({
        where: { ...this.without(movedColumnId), rank: { lt: rank.getValue() } },
        orderBy: { rank: 'desc' },
        select: { rank: true },
      }),
    );
  }

  override async findLastRank(movedColumnId: string): Promise<Rank | null> {
    return this.toRank(
      await this.prismaService.column.findFirst({
        where: this.without(movedColumnId),
        orderBy: { rank: 'desc' },
        select: { rank: true },
      }),
    );
  }

  override async rebalance(): Promise<void> {
    await this.prismaService.$transaction(async (transaction) => {
      // Deux rééquilibrages simultanés s'attendent au lieu de se gêner.
      await transaction.$queryRaw`SELECT id FROM boards WHERE id = ${this.boardId}::uuid FOR UPDATE`;
      const columns = await transaction.column.findMany({
        where: { boardId: this.boardId },
        orderBy: { rank: 'asc' },
        select: { id: true, rank: true },
      });
      const ids = columns.map(({ id }) => id);
      const ranks = createFreshRanks(columns.length, this.toRank(columns.at(-1) ?? null));
      const values = ranks.map((rank) => rank.getValue());
      await transaction.$executeRaw`
        UPDATE columns SET rank = fresh.rank
        FROM unnest(${ids}::uuid[], ${values}::text[]) AS fresh (id, rank)
        WHERE columns.id = fresh.id AND columns.board_id = ${this.boardId}::uuid`;
    });
  }

  private without(columnId: string) {
    return { boardId: this.boardId, id: { not: columnId } };
  }

  private toRank(record: { rank: string } | null): Rank | null {
    return record && Rank.fromValue(record.rank);
  }
}
