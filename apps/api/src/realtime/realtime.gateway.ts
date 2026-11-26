import {
  joinBoardRequestSchema,
  type JoinBoardResponse,
  REALTIME_MESSAGES,
} from '@handle-it/contracts';
import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { type CookieRequest, SessionCookie } from '../auth/session-cookie.js';
import { SessionService } from '../session/session.service.js';
import { Clock } from '../shared/time/clock.js';
import { BoardConnectionService } from './board-connection.service.js';
import type { RealtimeSocket } from './realtime-socket.js';
import { getBoardRoom, getSessionRoom, getUserRoom } from './rooms.js';
import { SocketIoServer } from './socket-io-server.js';

const UNAUTHENTICATED = 'UNAUTHENTICATED';
const UNAVAILABLE = 'UNAVAILABLE';

/** Entrée des connexions en direct : authentification, expiration et abonnement à un board. */
@Injectable()
export class RealtimeGateway implements OnModuleInit {
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    @Inject(SocketIoServer) private readonly socketIoServer: SocketIoServer,
    @Inject(SessionCookie) private readonly sessionCookie: SessionCookie,
    @Inject(SessionService) private readonly sessionService: SessionService,
    @Inject(BoardConnectionService)
    private readonly boardConnectionService: BoardConnectionService,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  onModuleInit(): void {
    const server = this.socketIoServer.getServer();
    server.use((socket, next) => {
      this.authenticate(socket).then(
        (isAuthenticated) => next(isAuthenticated ? undefined : new Error(UNAUTHENTICATED)),
        (error: unknown) => {
          this.logFailure('authentification', error);
          next(new Error(UNAVAILABLE));
        },
      );
    });
    server.on('connection', (socket) => this.welcome(socket));
  }

  private async authenticate(socket: RealtimeSocket): Promise<boolean> {
    // cookie-parser a complété la requête d'ouverture de la connexion.
    const request = socket.request as unknown as CookieRequest;
    const token = this.sessionCookie.read(request);
    const session = token && (await this.sessionService.find(token));
    if (!session) return false;
    socket.data.userId = session.getUserId();
    socket.data.tokenHash = session.getTokenHash();
    socket.data.expiresAt = session.getExpiresAt();
    return true;
  }

  private welcome(socket: RealtimeSocket): void {
    const { userId, tokenHash, expiresAt } = socket.data;
    void socket.join([getUserRoom(userId), getSessionRoom(tokenHash)]);
    const remaining = expiresAt.getTime() - this.clock.now().getTime();
    const expiration = setTimeout(() => socket.disconnect(true), remaining);
    socket.on('disconnect', () => clearTimeout(expiration));
    socket.on(REALTIME_MESSAGES.joinBoard, (request, reply) => {
      if (typeof reply !== 'function') return;
      this.join(socket, request).then(
        (response) => reply(response),
        (error: unknown) => {
          this.logFailure('abonnement', error);
          // Sans réponse exploitable, le client se reconnecte et réessaie.
          socket.disconnect(true);
        },
      );
    });
  }

  private async join(socket: RealtimeSocket, request: unknown): Promise<JoinBoardResponse> {
    const result = joinBoardRequestSchema.safeParse(request);
    if (!result.success) return { status: 'refused' };
    const { boardId } = result.data;
    const version = await this.boardConnectionService.join(socket.data.userId, boardId, {
      enter: (id) => socket.join(getBoardRoom(id)),
      leave: (id) => socket.leave(getBoardRoom(id)),
    });
    return version === null ? { status: 'refused' } : { status: 'joined', version };
  }

  private logFailure(step: string, error: unknown): void {
    // Le message brut peut contenir des données personnelles.
    const errorName = error instanceof Error ? error.name : 'inconnue';
    this.logger.error(`Échec temps réel, ${step} (${errorName})`);
  }
}
