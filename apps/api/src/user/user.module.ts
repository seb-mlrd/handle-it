import { Module } from '@nestjs/common';
import { PrismaUserRepository } from './prisma-user.repository.js';
import { UserRepository } from './user.repository.js';

@Module({
  providers: [{ provide: UserRepository, useClass: PrismaUserRepository }],
  exports: [UserRepository],
})
export class UserModule {}
