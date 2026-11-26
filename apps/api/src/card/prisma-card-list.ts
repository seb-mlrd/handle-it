import type { TransactionContext } from '../database/transaction-context.js';
import { createFreshRanks } from '../shared/ranking/create-fresh-ranks.js';
import { Rank } from '../shared/ranking/rank.value-object.js';
import { RankedList } from '../shared/ranking/ranked-list.js';

/** Cartes d'une colonne, vues comme une liste ordonnée. */
export class PrismaCardList extends RankedList {
  constructor(
    private readonly transactionContext: TransactionContext,
    private readonly columnId: string,
  ) {
    super();
  }

  override async findRank(cardId: string): Promise<Rank | null> {
    return this.toRank(
      await this.transactionContext.getClient().card.findFirst({
        where: { id: cardId, columnId: this.columnId },
        select: { rank: true },
      }),
    );
  }

  override async findNextRank(rank: Rank, movedCardId: string): Promise<Rank | null> {
    return this.toRank(
      await this.transactionContext.getClient().card.findFirst({
        where: { ...this.without(movedCardId), rank: { gt: rank.getValue() } },
        orderBy: { rank: 'asc' },
        select: { rank: true },
      }),
    );
  }

  override async findPreviousRank(rank: Rank, movedCardId: string): Promise<Rank | null> {
    return this.toRank(
      await this.transactionContext.getClient().card.findFirst({
        where: { ...this.without(movedCardId), rank: { lt: rank.getValue() } },
        orderBy: { rank: 'desc' },
        select: { rank: true },
      }),
    );
  }

  override async findLastRank(movedCardId: string): Promise<Rank | null> {
    return this.toRank(
      await this.transactionContext.getClient().card.findFirst({
        where: this.without(movedCardId),
        orderBy: { rank: 'desc' },
        select: { rank: true },
      }),
    );
  }

  override async findPreviousId(rank: Rank, movedCardId: string): Promise<string | null> {
    const record = await this.transactionContext.getClient().card.findFirst({
      where: { ...this.without(movedCardId), rank: { lt: rank.getValue() } },
      orderBy: { rank: 'desc' },
      select: { id: true },
    });
    return record?.id ?? null;
  }

  override async rebalance(): Promise<void> {
    const client = this.transactionContext.getClient();
    const cards = await client.card.findMany({
      where: { columnId: this.columnId },
      orderBy: { rank: 'asc' },
      select: { id: true, rank: true },
    });
    const ids = cards.map(({ id }) => id);
    const ranks = createFreshRanks(cards.length, this.toRank(cards.at(-1) ?? null));
    const values = ranks.map((rank) => rank.getValue());
    await client.$executeRaw`
      UPDATE cards SET rank = fresh.rank
      FROM unnest(${ids}::uuid[], ${values}::text[]) AS fresh (id, rank)
      WHERE cards.id = fresh.id AND cards.column_id = ${this.columnId}::uuid`;
  }

  private without(cardId: string) {
    return { columnId: this.columnId, id: { not: cardId } };
  }

  private toRank(record: { rank: string } | null): Rank | null {
    return record && Rank.fromValue(record.rank);
  }
}
