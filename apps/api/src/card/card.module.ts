import { Module } from '@nestjs/common';
import { RankPlacer } from '../shared/ranking/rank-placer.js';
import { BoardChanges } from '../board/board-changes.js';
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
    RankPlacer,
    { provide: CardRepository, useClass: PrismaCardRepository },
    {
      provide: CardService,
      useFactory: (...dependencies: ConstructorParameters<typeof CardService>) =>
        new CardService(...dependencies),
      inject: [CardRepository, ColumnRepository, BoardAccessService, RankPlacer, BoardChanges],
    },
  ],
  exports: [CardRepository],
})
export class CardModule {}
