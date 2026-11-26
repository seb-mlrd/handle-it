import type { TransactionContext } from '../database/transaction-context.js';
import { createFreshRanks } from '../shared/ranking/create-fresh-ranks.js';
import { Rank } from '../shared/ranking/rank.value-object.js';
import { RankedList } from '../shared/ranking/ranked-list.js';

/** Colonnes d'un board, vues comme une liste ordonnée. */
export class PrismaColumnList extends RankedList {
  constructor(
    private readonly transactionContext: TransactionContext,
    private readonly boardId: string,
  ) {
    super();
  }

  override async findRank(columnId: string): Promise<Rank | null> {
    return this.toRank(
      await this.transactionContext.getClient().column.findFirst({
        where: { id: columnId, boardId: this.boardId },
        select: { rank: true },
      }),
    );
  }

  override async findNextRank(rank: Rank, movedColumnId: string): Promise<Rank | null> {
    return this.toRank(
      await this.transactionContext.getClient().column.findFirst({
        where: { ...this.without(movedColumnId), rank: { gt: rank.getValue() } },
        orderBy: { rank: 'asc' },
        select: { rank: true },
      }),
    );
  }

  override async findPreviousRank(rank: Rank, movedColumnId: string): Promise<Rank | null> {
    return this.toRank(
      await this.transactionContext.getClient().column.findFirst({
        where: { ...this.without(movedColumnId), rank: { lt: rank.getValue() } },
        orderBy: { rank: 'desc' },
        select: { rank: true },
      }),
    );
  }

  override async findLastRank(movedColumnId: string): Promise<Rank | null> {
    return this.toRank(
      await this.transactionContext.getClient().column.findFirst({
        where: this.without(movedColumnId),
        orderBy: { rank: 'desc' },
        select: { rank: true },
      }),
    );
  }

  override async findPreviousId(rank: Rank, movedColumnId: string): Promise<string | null> {
    const record = await this.transactionContext.getClient().column.findFirst({
      where: { ...this.without(movedColumnId), rank: { lt: rank.getValue() } },
      orderBy: { rank: 'desc' },
      select: { id: true },
    });
    return record?.id ?? null;
  }

  override async rebalance(): Promise<void> {
    const client = this.transactionContext.getClient();
    const columns = await client.column.findMany({
      where: { boardId: this.boardId },
      orderBy: { rank: 'asc' },
      select: { id: true, rank: true },
    });
    const ids = columns.map(({ id }) => id);
    const ranks = createFreshRanks(columns.length, this.toRank(columns.at(-1) ?? null));
    const values = ranks.map((rank) => rank.getValue());
    await client.$executeRaw`
      UPDATE columns SET rank = fresh.rank
      FROM unnest(${ids}::uuid[], ${values}::text[]) AS fresh (id, rank)
      WHERE columns.id = fresh.id AND columns.board_id = ${this.boardId}::uuid`;
  }

  private without(columnId: string) {
    return { boardId: this.boardId, id: { not: columnId } };
  }

  private toRank(record: { rank: string } | null): Rank | null {
    return record && Rank.fromValue(record.rank);
  }
}
