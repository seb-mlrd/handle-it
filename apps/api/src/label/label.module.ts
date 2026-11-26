import { Module } from '@nestjs/common';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardChanges } from '../board/board-changes.js';
import { BoardModule } from '../board/board.module.js';
import { CardModule } from '../card/card.module.js';
import { CardRepository } from '../card/card.repository.js';
import { LabelController } from './label.controller.js';
import { LabelRepository } from './label.repository.js';
import { LabelService } from './label.service.js';
import { PrismaLabelRepository } from './prisma-label.repository.js';

@Module({
  imports: [BoardModule, CardModule],
  controllers: [LabelController],
  providers: [
    { provide: LabelRepository, useClass: PrismaLabelRepository },
    {
      provide: LabelService,
      useFactory: (...dependencies: ConstructorParameters<typeof LabelService>) =>
        new LabelService(...dependencies),
      inject: [LabelRepository, CardRepository, BoardAccessService, BoardChanges],
    },
  ],
  exports: [LabelRepository],
})
export class LabelModule {}
