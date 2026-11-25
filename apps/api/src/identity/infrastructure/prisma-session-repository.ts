import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma-service.js';
import { SessionRepository } from '../application/session-repository.js';
import { Session } from '../domain/session.js';

@Injectable()
export class PrismaSessionRepository extends SessionRepository {
  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {
    super();
  }

  override async add(session: Session): Promise<void> {
    await this.prismaService.session.create({
      data: {
        tokenHash: session.getTokenHash(),
        userId: session.getUserId(),
        expiresAt: session.getExpiresAt(),
      },
      select: { tokenHash: true },
    });
  }

  override async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const record = await this.prismaService.session.findUnique({
      where: { tokenHash },
      select: { userId: true, expiresAt: true },
    });
    return record && new Session(record.userId, tokenHash, record.expiresAt);
  }

  override async deleteByTokenHash(tokenHash: string): Promise<void> {
    // deleteMany n'échoue pas si la session a déjà disparu : la déconnexion est idempotente.
    await this.prismaService.session.deleteMany({ where: { tokenHash } });
  }

  override async deleteExpired(now: Date): Promise<void> {
    await this.prismaService.session.deleteMany({ where: { expiresAt: { lte: now } } });
  }
}
