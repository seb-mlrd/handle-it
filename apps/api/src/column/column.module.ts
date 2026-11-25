import { Module } from '@nestjs/common';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardModule } from '../board/board.module.js';
import { ColumnController } from './column.controller.js';
import { ColumnRepository } from './column.repository.js';
import { ColumnService } from './column.service.js';
import { PrismaColumnRepository } from './prisma-column.repository.js';

@Module({
  imports: [BoardModule],
  controllers: [ColumnController],
  providers: [
    { provide: ColumnRepository, useClass: PrismaColumnRepository },
    {
      provide: ColumnService,
      useFactory: (...dependencies: ConstructorParameters<typeof ColumnService>) =>
        new ColumnService(...dependencies),
      inject: [ColumnRepository, BoardAccessService],
    },
  ],
  exports: [ColumnRepository],
})
export class ColumnModule {}
