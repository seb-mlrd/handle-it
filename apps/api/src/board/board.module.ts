import { Module } from '@nestjs/common';
import { BoardController } from './board.controller.js';
import { BoardRepository } from './board.repository.js';
import { BoardService } from './board.service.js';
import { BoardAccessService } from './board-access.service.js';
import { BoardAccessPolicy } from './board-access-policy.js';
import { ActivityRepository } from '../activity/activity.repository.js';
import { PrismaActivityRepository } from '../activity/prisma-activity.repository.js';
import { BoardChanges } from './board-changes.js';
import { PrismaBoardChanges } from './prisma-board-changes.js';
import { PrismaBoardRepository } from './prisma-board.repository.js';

@Module({
  controllers: [BoardController],
  providers: [
    { provide: BoardRepository, useClass: PrismaBoardRepository },
    { provide: ActivityRepository, useClass: PrismaActivityRepository },
    { provide: BoardChanges, useClass: PrismaBoardChanges },
    { provide: BoardAccessPolicy, useFactory: () => new BoardAccessPolicy() },
    {
      provide: BoardAccessService,
      useFactory: (...dependencies: ConstructorParameters<typeof BoardAccessService>) =>
        new BoardAccessService(...dependencies),
      inject: [BoardRepository, BoardAccessPolicy],
    },
    {
      provide: BoardService,
      useFactory: (...dependencies: ConstructorParameters<typeof BoardService>) =>
        new BoardService(...dependencies),
      inject: [BoardRepository, BoardAccessService, BoardChanges],
    },
  ],
  exports: [BoardRepository, BoardAccessService, BoardChanges, ActivityRepository],
})
export class BoardModule {}
