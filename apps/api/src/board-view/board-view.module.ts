import { Module } from '@nestjs/common';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardModule } from '../board/board.module.js';
import { BoardRepository } from '../board/board.repository.js';
import { CardModule } from '../card/card.module.js';
import { CardRepository } from '../card/card.repository.js';
import { ColumnModule } from '../column/column.module.js';
import { ColumnRepository } from '../column/column.repository.js';
import { BoardViewController } from './board-view.controller.js';
import { BoardViewService } from './board-view.service.js';

@Module({
  imports: [BoardModule, ColumnModule, CardModule],
  controllers: [BoardViewController],
  providers: [
    {
      provide: BoardViewService,
      useFactory: (...dependencies: ConstructorParameters<typeof BoardViewService>) =>
        new BoardViewService(...dependencies),
      inject: [BoardRepository, ColumnRepository, CardRepository, BoardAccessService],
    },
  ],
})
export class BoardViewModule {}
