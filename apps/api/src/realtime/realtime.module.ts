import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardModule } from '../board/board.module.js';
import { BoardRepository } from '../board/board.repository.js';
import { SessionModule } from '../session/session.module.js';
import { BoardConnectionService } from './board-connection.service.js';
import { RealtimeGateway } from './realtime.gateway.js';

@Module({
  imports: [AuthModule, SessionModule, BoardModule],
  providers: [
    RealtimeGateway,
    {
      provide: BoardConnectionService,
      useFactory: (...dependencies: ConstructorParameters<typeof BoardConnectionService>) =>
        new BoardConnectionService(...dependencies),
      inject: [BoardAccessService, BoardRepository],
    },
  ],
})
export class RealtimeModule {}
