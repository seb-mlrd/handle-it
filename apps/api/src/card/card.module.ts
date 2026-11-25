import { Module } from '@nestjs/common';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardModule } from '../board/board.module.js';
import { ColumnModule } from '../column/column.module.js';
import { ColumnRepository } from '../column/column.repository.js';
import { CardController } from './card.controller.js';
import { CardRepository } from './card.repository.js';
import { CardService } from './card.service.js';
import { PrismaCardRepository } from './prisma-card.repository.js';

@Module({
  imports: [BoardModule, ColumnModule],
  controllers: [CardController],
  providers: [
    { provide: CardRepository, useClass: PrismaCardRepository },
    {
      provide: CardService,
      useFactory: (...dependencies: ConstructorParameters<typeof CardService>) =>
        new CardService(...dependencies),
      inject: [CardRepository, ColumnRepository, BoardAccessService],
    },
  ],
  exports: [CardRepository],
})
export class CardModule {}
