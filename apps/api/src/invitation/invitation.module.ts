import { Module } from '@nestjs/common';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardChanges } from '../board/board-changes.js';
import { BoardModule } from '../board/board.module.js';
import { BoardRepository } from '../board/board.repository.js';
import { TokenService } from '../shared/security/token.service.js';
import { Clock } from '../shared/time/clock.js';
import { BoardInvitationController } from './board-invitation.controller.js';
import { InvitationController } from './invitation.controller.js';
import { InvitationRepository } from './invitation.repository.js';
import { InvitationService } from './invitation.service.js';
import { PrismaInvitationRepository } from './prisma-invitation.repository.js';

@Module({
  imports: [BoardModule],
  controllers: [BoardInvitationController, InvitationController],
  providers: [
    { provide: InvitationRepository, useClass: PrismaInvitationRepository },
    {
      provide: InvitationService,
      useFactory: (...dependencies: ConstructorParameters<typeof InvitationService>) =>
        new InvitationService(...dependencies),
      inject: [
        InvitationRepository,
        BoardRepository,
        BoardAccessService,
        TokenService,
        Clock,
        BoardChanges,
      ],
    },
  ],
})
export class InvitationModule {}
