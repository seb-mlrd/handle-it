import { type BoardEventEnvelope, REALTIME_MESSAGES, REALTIME_PATH } from '@handle-it/contracts';
import {
  type BeforeApplicationShutdown,
  Inject,
  Injectable,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { BoardEventPublisher } from '../board/board-event.publisher.js';
import { Environment } from '../config/environment.js';
import type { SessionDisconnector } from '../session/session-disconnector.js';
import type { RealtimeServer } from './realtime-socket.js';
import { getBoardRoom, getSessionRoom, getUserRoom } from './rooms.js';

// Une coupure silencieuse est vue en 25 s au plus, contre 45 par défaut.
const PING_INTERVAL_MILLISECONDS = 15_000;
const PING_TIMEOUT_MILLISECONDS = 10_000;
const MAX_MESSAGE_BYTES = 10_000;

/** Serveur Socket.IO, sans règle métier : diffusion et coupures. */
@Injectable()
export class SocketIoServer
  extends BoardEventPublisher
  implements SessionDisconnector, OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly server: RealtimeServer;

  constructor(
    @Inject(Environment) environment: Environment,
    @Inject(HttpAdapterHost) private readonly httpAdapterHost: HttpAdapterHost,
  ) {
    super();
    this.server = new Server({
      path: REALTIME_PATH,
      serveClient: false,
      // WebSocket seul : aucune affinité de serveur à garantir, contrairement au mode « polling ».
      transports: ['websocket'],
      pingInterval: PING_INTERVAL_MILLISECONDS,
      pingTimeout: PING_TIMEOUT_MILLISECONDS,
      maxHttpBufferSize: MAX_MESSAGE_BYTES,
      // Le navigateur n'applique pas CORS aux WebSockets : l'origine se contrôle ici.
      allowRequest: (request, decide) =>
        decide(null, request.headers.origin === environment.getWebOrigin()),
    });
  }

  getServer(): RealtimeServer {
    return this.server;
  }

  onApplicationBootstrap(): void {
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer() as HttpServer;
    this.server.attach(httpServer);
    this.server.engine.use(cookieParser());
  }

  beforeApplicationShutdown(): void {
    // Le serveur HTTP est fermé par NestJS : seules les connexions en direct sont coupées ici.
    this.server.disconnectSockets(true);
    this.server.engine.close();
  }

  override publish(envelope: BoardEventEnvelope): void {
    this.server.to(getBoardRoom(envelope.boardId)).emit(REALTIME_MESSAGES.boardEvent, envelope);
  }

  override evict(boardId: string, userId: string): void {
    const boardRoom = getBoardRoom(boardId);
    const userRoom = getUserRoom(userId);
    this.server.in(userRoom).socketsLeave(boardRoom);
    this.server.to(userRoom).emit(REALTIME_MESSAGES.boardAccessLost, { boardId });
  }

  disconnect(tokenHash: string): void {
    this.server.in(getSessionRoom(tokenHash)).disconnectSockets(true);
  }
}
