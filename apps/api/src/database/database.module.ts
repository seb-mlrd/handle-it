import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { TransactionContext } from './transaction-context.js';

@Global()
@Module({
  providers: [PrismaService, TransactionContext],
  exports: [PrismaService, TransactionContext],
})
export class DatabaseModule {}
