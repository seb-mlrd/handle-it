import { Inject, Injectable } from '@nestjs/common';
import { BoardNotFoundError } from '../board/errors/board-not-found.error.js';
import { isForeignKeyViolation } from '../database/prisma-errors.js';
import { TransactionContext } from '../database/transaction-context.js';
import type { Prisma } from '../generated/prisma/client.js';
import { InvitationInvalidError } from './errors/invitation-invalid.error.js';
import { Invitation } from './invitation.entity.js';
import { InvitationRepository } from './invitation.repository.js';

const INVITATION_FIELDS = { id: true, boardId: true, tokenHash: true, expiresAt: true } as const;

type InvitationRecord = Prisma.InvitationGetPayload<{ select: typeof INVITATION_FIELDS }>;

@Injectable()
export class PrismaInvitationRepository extends InvitationRepository {
  constructor(@Inject(TransactionContext) private readonly transactionContext: TransactionContext) {
    super();
  }

  override async add(invitation: Invitation): Promise<void> {
    try {
      await this.transactionContext.getClient().invitation.create({
        data: {
          id: invitation.getId(),
          boardId: invitation.getBoardId(),
          tokenHash: invitation.getTokenHash(),
          expiresAt: invitation.getExpiresAt(),
        },
        select: { id: true },
      });
    } catch (error) {
      throw isForeignKeyViolation(error) ? new BoardNotFoundError() : error;
    }
  }

  override async findByTokenHash(tokenHash: string): Promise<Invitation | null> {
    const record = await this.transactionContext.getClient().invitation.findUnique({
      where: { tokenHash },
      select: INVITATION_FIELDS,
    });
    return record && this.toInvitation(record);
  }

  override async findActiveByBoard(boardId: string, now: Date): Promise<Invitation[]> {
    const records = await this.transactionContext.getClient().invitation.findMany({
      where: { boardId, expiresAt: { gt: now } },
      orderBy: [{ expiresAt: 'asc' }, { id: 'asc' }],
      select: INVITATION_FIELDS,
    });
    return records.map((record) => this.toInvitation(record));
  }

  override async consume(invitation: Invitation): Promise<void> {
    const { count } = await this.transactionContext.getClient().invitation.deleteMany({
      where: { id: invitation.getId() },
    });
    if (count === 0) {
      throw new InvitationInvalidError();
    }
  }

  override async deleteExpired(now: Date): Promise<void> {
    await this.transactionContext
      .getClient()
      .invitation.deleteMany({ where: { expiresAt: { lte: now } } });
  }

  private toInvitation(record: InvitationRecord): Invitation {
    return new Invitation(record.id, record.boardId, record.tokenHash, record.expiresAt);
  }
}
