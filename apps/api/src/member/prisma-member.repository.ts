import { Inject, Injectable } from '@nestjs/common';
import { TransactionContext } from '../database/transaction-context.js';
import { MemberNotFoundError } from './errors/member-not-found.error.js';
import type { Member } from './member.js';
import { MemberRepository } from './member.repository.js';

@Injectable()
export class PrismaMemberRepository extends MemberRepository {
  constructor(@Inject(TransactionContext) private readonly transactionContext: TransactionContext) {
    super();
  }

  override async findDisplayName(boardId: string, userId: string): Promise<string | null> {
    const record = await this.transactionContext.getClient().membership.findUnique({
      where: { boardId_userId: { boardId, userId } },
      select: { user: { select: { displayName: true } } },
    });
    return record?.user.displayName ?? null;
  }

  override async findAllByBoard(boardId: string): Promise<Member[]> {
    const records = await this.transactionContext.getClient().membership.findMany({
      where: { boardId },
      // L'énumération déclare « owner » avant « member » : PostgreSQL suit cet ordre.
      orderBy: [{ role: 'asc' }, { user: { displayName: 'asc' } }, { userId: 'asc' }],
      select: { userId: true, role: true, user: { select: { displayName: true } } },
    });
    return records.map(({ userId, role, user }) => ({
      userId,
      role,
      displayName: user.displayName,
    }));
  }

  override async expel(boardId: string, userId: string): Promise<void> {
    await this.remove(boardId, userId);
    await this.transactionContext.getClient().invitation.deleteMany({ where: { boardId } });
  }

  override async remove(boardId: string, userId: string): Promise<void> {
    const { count } = await this.transactionContext.getClient().membership.deleteMany({
      where: { boardId, userId, role: 'member' },
    });
    if (count === 0) {
      throw new MemberNotFoundError();
    }
  }
}
