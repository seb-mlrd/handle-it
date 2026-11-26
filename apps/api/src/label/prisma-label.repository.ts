import type { LabelColor } from '@handle-it/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { isUniqueViolation } from '../database/prisma-errors.js';
import { TransactionContext } from '../database/transaction-context.js';
import { LabelNameTakenError } from './errors/label-name-taken.error.js';
import { LabelNotFoundError } from './errors/label-not-found.error.js';
import { Label } from './label.entity.js';
import { LabelRepository } from './label.repository.js';

const LABEL_FIELDS = { id: true, boardId: true, name: true, color: true } as const;

interface LabelRecord {
  readonly id: string;
  readonly boardId: string;
  readonly name: string;
  readonly color: string;
}

@Injectable()
export class PrismaLabelRepository extends LabelRepository {
  constructor(@Inject(TransactionContext) private readonly transactionContext: TransactionContext) {
    super();
  }

  override async add(label: Label): Promise<void> {
    await this.translateNameConflict(() =>
      this.client().label.create({
        data: {
          id: label.getId(),
          boardId: label.getBoardId(),
          name: label.getName(),
          nameKey: label.getNameKey(),
          color: label.getColor(),
        },
        select: { id: true },
      }),
    );
  }

  override async findAllByBoard(boardId: string): Promise<Label[]> {
    const records = await this.client().label.findMany({
      where: { boardId },
      orderBy: [{ nameKey: 'asc' }, { id: 'asc' }],
      select: LABEL_FIELDS,
    });
    return records.map((record) => this.toLabel(record));
  }

  override async findById(boardId: string, labelId: string): Promise<Label | null> {
    const record = await this.client().label.findFirst({
      where: { id: labelId, boardId },
      select: LABEL_FIELDS,
    });
    return record && this.toLabel(record);
  }

  override async update(label: Label): Promise<void> {
    const { count } = await this.translateNameConflict(() =>
      this.client().label.updateMany({
        where: { id: label.getId(), boardId: label.getBoardId() },
        data: { name: label.getName(), nameKey: label.getNameKey(), color: label.getColor() },
      }),
    );
    if (count === 0) throw new LabelNotFoundError();
  }

  override async delete(boardId: string, labelId: string): Promise<void> {
    const { count } = await this.client().label.deleteMany({ where: { id: labelId, boardId } });
    if (count === 0) throw new LabelNotFoundError();
  }

  override async findCardLabelIds(boardId: string): Promise<Map<string, string[]>> {
    const records = await this.client().cardLabel.findMany({
      where: { label: { boardId } },
      orderBy: [{ label: { nameKey: 'asc' } }, { labelId: 'asc' }],
      select: { cardId: true, labelId: true },
    });
    const byCard = new Map<string, string[]>();
    for (const { cardId, labelId } of records) {
      byCard.set(cardId, [...(byCard.get(cardId) ?? []), labelId]);
    }
    return byCard;
  }

  override async attach(cardId: string, labelId: string): Promise<string[]> {
    await this.client().cardLabel.createMany({ data: [{ cardId, labelId }], skipDuplicates: true });
    return this.findLabelIds(cardId);
  }

  override async detach(cardId: string, labelId: string): Promise<string[]> {
    await this.client().cardLabel.deleteMany({ where: { cardId, labelId } });
    return this.findLabelIds(cardId);
  }

  private async findLabelIds(cardId: string): Promise<string[]> {
    const records = await this.client().cardLabel.findMany({
      where: { cardId },
      orderBy: [{ label: { nameKey: 'asc' } }, { labelId: 'asc' }],
      select: { labelId: true },
    });
    return records.map(({ labelId }) => labelId);
  }

  private async translateNameConflict<Result>(write: () => Promise<Result>): Promise<Result> {
    try {
      return await write();
    } catch (error) {
      throw isUniqueViolation(error) ? new LabelNameTakenError() : error;
    }
  }

  private client() {
    return this.transactionContext.getClient();
  }

  private toLabel(record: LabelRecord): Label {
    return new Label(record.id, record.boardId, record.name, record.color as LabelColor);
  }
}
