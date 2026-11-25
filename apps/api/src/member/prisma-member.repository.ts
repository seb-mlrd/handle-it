import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { MemberNotFoundError } from './errors/member-not-found.error.js';
import type { Member } from './member.js';
import { MemberRepository } from './member.repository.js';

@Injectable()
export class PrismaMemberRepository extends MemberRepository {
  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {
    super();
  }

  override async findAllByBoard(boardId: string): Promise<Member[]> {
    const records = await this.prismaService.membership.findMany({
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
    await this.prismaService.$transaction(async (transaction) => {
      await this.deleteMembership(transaction, boardId, userId);
      await transaction.invitation.deleteMany({ where: { boardId } });
    });
  }

  override async remove(boardId: string, userId: string): Promise<void> {
    await this.deleteMembership(this.prismaService, boardId, userId);
  }

  private async deleteMembership(
    client: Prisma.TransactionClient,
    boardId: string,
    userId: string,
  ): Promise<void> {
    const { count } = await client.membership.deleteMany({
      where: { boardId, userId, role: 'member' },
    });
    if (count === 0) {
      throw new MemberNotFoundError();
    }
  }
}
