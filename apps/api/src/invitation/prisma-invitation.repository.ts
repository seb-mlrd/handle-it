import { Inject, Injectable } from '@nestjs/common';
import { BoardNotFoundError } from '../board/errors/board-not-found.error.js';
import type { Membership } from '../board/membership.entity.js';
import { isForeignKeyViolation, isUniqueViolation } from '../database/prisma-errors.js';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { InvitationInvalidError } from './errors/invitation-invalid.error.js';
import { Invitation } from './invitation.entity.js';
import { InvitationRepository } from './invitation.repository.js';

const INVITATION_FIELDS = { id: true, boardId: true, tokenHash: true, expiresAt: true } as const;

type InvitationRecord = Prisma.InvitationGetPayload<{ select: typeof INVITATION_FIELDS }>;

@Injectable()
export class PrismaInvitationRepository extends InvitationRepository {
  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {
    super();
  }

  override async add(invitation: Invitation): Promise<void> {
    try {
      await this.prismaService.invitation.create({
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
    const record = await this.prismaService.invitation.findUnique({
      where: { tokenHash },
      select: INVITATION_FIELDS,
    });
    return record && this.toInvitation(record);
  }

  override async findActiveByBoard(boardId: string, now: Date): Promise<Invitation[]> {
    const records = await this.prismaService.invitation.findMany({
      where: { boardId, expiresAt: { gt: now } },
      orderBy: [{ expiresAt: 'asc' }, { id: 'asc' }],
      select: INVITATION_FIELDS,
    });
    return records.map((record) => this.toInvitation(record));
  }

  override async accept(invitation: Invitation, member: Membership): Promise<void> {
    try {
      await this.prismaService.$transaction(async (transaction) => {
        // La suppression verrouille la ligne : un seul de deux invités simultanés y parvient.
        const { count } = await transaction.invitation.deleteMany({
          where: { id: invitation.getId() },
        });
        if (count === 0) {
          throw new InvitationInvalidError();
        }
        await transaction.membership.create({
          data: {
            boardId: member.getBoardId(),
            userId: member.getUserId(),
            role: member.getRole(),
          },
          select: { userId: true },
        });
      });
    } catch (error) {
      // Déjà membre par un autre lien : la transaction annulée laisse celui-ci utilisable.
      if (isUniqueViolation(error)) return;
      throw isForeignKeyViolation(error) ? new BoardNotFoundError() : error;
    }
  }

  override async deleteExpired(now: Date): Promise<void> {
    await this.prismaService.invitation.deleteMany({ where: { expiresAt: { lte: now } } });
  }

  private toInvitation(record: InvitationRecord): Invitation {
    return new Invitation(record.id, record.boardId, record.tokenHash, record.expiresAt);
  }
}
