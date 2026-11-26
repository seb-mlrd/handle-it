import { randomUUID } from 'node:crypto';
import { activityDetailsSchema } from '@handle-it/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionContext } from '../database/transaction-context.js';
import type { Prisma } from '../generated/prisma/client.js';
import { CreationCursor } from '../shared/pagination/creation-cursor.js';
import { Activity } from './activity.entity.js';
import type { ActivityEntry } from './activity-entry.js';
import type { ActivityPage } from './activity-page.js';
import { ActivityRepository, type ActivityQuery } from './activity.repository.js';

const ACTIVITY_FIELDS = {
  id: true,
  cardId: true,
  type: true,
  details: true,
  createdAt: true,
  actor: { select: { displayName: true } },
} as const;

type ActivityRecord = Prisma.ActivityGetPayload<{ select: typeof ACTIVITY_FIELDS }>;

@Injectable()
export class PrismaActivityRepository extends ActivityRepository {
  constructor(@Inject(TransactionContext) private readonly transactionContext: TransactionContext) {
    super();
  }

  override async add(boardId: string, actorId: string, entry: ActivityEntry): Promise<void> {
    const { type, ...details } = entry.details;
    await this.transactionContext.getClient().activity.create({
      data: { id: randomUUID(), boardId, actorId, cardId: entry.cardId, type, details },
      select: { id: true },
    });
  }

  override async findPage(query: ActivityQuery): Promise<ActivityPage> {
    // Une entrée de plus que demandé indique qu'une page suivante existe.
    const records = await this.transactionContext.getClient().activity.findMany({
      where: this.buildWhere(query),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      select: ACTIVITY_FIELDS,
    });
    const items = records.slice(0, query.limit).map((record) => this.toActivity(record));
    const last = items.at(-1);
    const hasMore = records.length > query.limit;
    return {
      items,
      next: hasMore && last ? CreationCursor.after(last.getCreatedAt(), last.getId()) : null,
    };
  }

  private buildWhere({ boardId, cardId, before }: ActivityQuery): Prisma.ActivityWhereInput {
    const scope = cardId ? { boardId, cardId } : { boardId };
    if (!before) return scope;
    const createdAt = before.getCreatedAt();
    return {
      ...scope,
      OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: before.getId() } }],
    };
  }

  private toActivity(record: ActivityRecord): Activity {
    const storedDetails = record.details as Record<string, unknown>;
    // Relu à travers le contrat : une entrée écrite autrement échoue ici, jamais chez le client.
    const details = activityDetailsSchema.parse({ ...storedDetails, type: record.type });
    const actorName = record.actor?.displayName ?? null;
    return new Activity(record.id, actorName, record.cardId, record.createdAt, details);
  }
}
