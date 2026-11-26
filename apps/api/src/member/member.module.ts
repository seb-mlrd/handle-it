import { Module } from '@nestjs/common';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardChanges } from '../board/board-changes.js';
import { BoardEventPublisher } from '../board/board-event.publisher.js';
import { BoardModule } from '../board/board.module.js';
import { MemberController } from './member.controller.js';
import { MemberRepository } from './member.repository.js';
import { MemberService } from './member.service.js';
import { PrismaMemberRepository } from './prisma-member.repository.js';

@Module({
  imports: [BoardModule],
  controllers: [MemberController],
  providers: [
    { provide: MemberRepository, useClass: PrismaMemberRepository },
    {
      provide: MemberService,
      useFactory: (...dependencies: ConstructorParameters<typeof MemberService>) =>
        new MemberService(...dependencies),
      inject: [MemberRepository, BoardAccessService, BoardChanges, BoardEventPublisher],
    },
  ],
})
export class MemberModule {}
