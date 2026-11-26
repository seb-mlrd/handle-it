import { Module } from '@nestjs/common';
import { BoardAccessPolicy } from '../board/board-access-policy.js';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardChanges } from '../board/board-changes.js';
import { BoardModule } from '../board/board.module.js';
import { CardModule } from '../card/card.module.js';
import { CardRepository } from '../card/card.repository.js';
import { Clock } from '../shared/time/clock.js';
import { CommentController } from './comment.controller.js';
import { CommentRepository } from './comment.repository.js';
import { CommentService } from './comment.service.js';
import { PrismaCommentRepository } from './prisma-comment.repository.js';

@Module({
  imports: [BoardModule, CardModule],
  controllers: [CommentController],
  providers: [
    { provide: CommentRepository, useClass: PrismaCommentRepository },
    {
      provide: CommentService,
      useFactory: (...dependencies: ConstructorParameters<typeof CommentService>) =>
        new CommentService(...dependencies),
      inject: [
        CommentRepository,
        CardRepository,
        BoardAccessService,
        BoardAccessPolicy,
        BoardChanges,
        Clock,
      ],
    },
  ],
  exports: [CommentRepository],
})
export class CommentModule {}
