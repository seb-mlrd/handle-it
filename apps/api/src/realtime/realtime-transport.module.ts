import { Global, Module } from '@nestjs/common';
import { BoardEventPublisher } from '../board/board-event.publisher.js';
import { SessionDisconnector } from '../session/session-disconnector.js';
import { SocketIoServer } from './socket-io-server.js';

/** Transport seul, sans domaine : les domaines peuvent en dépendre sans cycle. */
@Global()
@Module({
  providers: [
    SocketIoServer,
    { provide: BoardEventPublisher, useExisting: SocketIoServer },
    { provide: SessionDisconnector, useExisting: SocketIoServer },
  ],
  exports: [SocketIoServer, BoardEventPublisher, SessionDisconnector],
})
export class RealtimeTransportModule {}
