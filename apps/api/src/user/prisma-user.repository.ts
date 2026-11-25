import { Inject, Injectable } from '@nestjs/common';
import { isUniqueViolation } from '../database/prisma-errors.js';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { UserRepository } from './user.repository.js';
import { Email } from './email.value-object.js';
import { EmailAlreadyUsedError } from './errors/email-already-used.error.js';
import { User } from './user.entity.js';

const USER_FIELDS = { id: true, email: true, displayName: true, passwordHash: true } as const;

type UserRecord = Prisma.UserGetPayload<{ select: typeof USER_FIELDS }>;

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {
    super();
  }

  override async add(user: User): Promise<void> {
    try {
      await this.prismaService.user.create({
        data: {
          id: user.getId(),
          email: user.getEmail().getValue(),
          displayName: user.getDisplayName(),
          passwordHash: user.getPasswordHash(),
        },
        select: { id: true },
      });
    } catch (error) {
      throw isUniqueViolation(error) ? new EmailAlreadyUsedError() : error;
    }
  }

  override async findByEmail(email: Email): Promise<User | null> {
    const where = { email: email.getValue() };
    return this.toUser(await this.prismaService.user.findUnique({ where, select: USER_FIELDS }));
  }

  override async findById(id: string): Promise<User | null> {
    return this.toUser(
      await this.prismaService.user.findUnique({ where: { id }, select: USER_FIELDS }),
    );
  }

  private toUser(record: UserRecord | null): User | null {
    return (
      record &&
      new User(record.id, Email.create(record.email), record.displayName, record.passwordHash)
    );
  }
}
