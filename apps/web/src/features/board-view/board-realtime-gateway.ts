import {
  boardAccessLostSchema,
  type BoardEventEnvelope,
  boardEventEnvelopeSchema,
  joinBoardResponseSchema,
  REALTIME_MESSAGES,
  REALTIME_PATH,
} from '@handle-it/contracts';
import type { Socket } from 'socket.io-client';

export type ConnectionStatus = 'connecting' | 'live' | 'offline';

export interface BoardRealtimeListener {
  readonly onStatus: (status: ConnectionStatus) => void;
  /** Le board est suivi ; `isReconnection` signale que des événements ont pu être manqués. */
  readonly onJoined: (version: number, isReconnection: boolean) => void;
  readonly onEnvelope: (envelope: BoardEventEnvelope) => void;
  /** L'accès à ce board est perdu ou refusé. */
  readonly onAccessLost: () => void;
  readonly onUnauthenticated: () => void;
  /** Message illisible : seul un nouveau chargement garantit un écran juste. */
  readonly onUnreadable: () => void;
}

// Une tentative suspendue bloquerait la reconnexion 20 s par défaut.
const CONNECTION_TIMEOUT_MILLISECONDS = 5000;
const MAX_RECONNECTION_DELAY_MILLISECONDS = 3000;
const JOIN_TIMEOUT_MILLISECONDS = 5000;
const RETRY_DELAY_MILLISECONDS = 2000;
const UNAUTHENTICATED_MESSAGE = 'UNAUTHENTICATED';

/** Connexion en direct à un board. */
export class BoardRealtimeGateway {
  /** Suit un board jusqu'à l'appel de la fonction renvoyée. */
  follow(boardId: string, listener: BoardRealtimeListener): () => void {
    let subscription: BoardSubscription | null = null;
    let isStopped = false;
    listener.onStatus('connecting');
    // Chargé à la demande : seules les pages d'un board en ont besoin.
    import('socket.io-client').then(
      ({ io }) => {
        if (isStopped) return;
        const socket = io({
          path: REALTIME_PATH,
          transports: ['websocket'],
          forceNew: true,
          timeout: CONNECTION_TIMEOUT_MILLISECONDS,
          reconnectionDelayMax: MAX_RECONNECTION_DELAY_MILLISECONDS,
        });
        subscription = new BoardSubscription(socket, boardId, listener);
        subscription.start();
      },
      () => listener.onStatus('offline'),
    );
    return () => {
      isStopped = true;
      subscription?.stop();
    };
  }
}

class BoardSubscription {
  private hasJoined = false;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly socket: Socket,
    private readonly boardId: string,
    private readonly listener: BoardRealtimeListener,
  ) {}

  start(): void {
    this.socket.on('connect', () => void this.join());
    this.socket.on('connect_error', (error) => this.handleRefusal(error));
    this.socket.on('disconnect', () => this.handleLoss());
    this.socket.on(REALTIME_MESSAGES.boardEvent, (message: unknown) => this.receive(message));
    this.socket.on(REALTIME_MESSAGES.boardAccessLost, (message: unknown) => {
      const result = boardAccessLostSchema.safeParse(message);
      if (result.data?.boardId === this.boardId) this.listener.onAccessLost();
    });
  }

  stop(): void {
    clearTimeout(this.retryTimer);
    this.socket.off();
    this.socket.disconnect();
  }

  private async join(): Promise<void> {
    try {
      const answer: unknown = await this.socket
        .timeout(JOIN_TIMEOUT_MILLISECONDS)
        .emitWithAck(REALTIME_MESSAGES.joinBoard, { boardId: this.boardId });
      const response = joinBoardResponseSchema.parse(answer);
      if (response.status === 'refused') {
        this.listener.onAccessLost();
        return;
      }
      this.listener.onStatus('live');
      this.listener.onJoined(response.version, this.hasJoined);
      this.hasJoined = true;
    } catch {
      // Réponse absente ou illisible : on repart d'une connexion neuve.
      this.socket.disconnect();
    }
  }

  private receive(message: unknown): void {
    const result = boardEventEnvelopeSchema.safeParse(message);
    if (!result.success) {
      this.listener.onUnreadable();
    } else if (result.data.boardId === this.boardId) {
      this.listener.onEnvelope(result.data);
    }
  }

  private handleRefusal(error: Error): void {
    this.listener.onStatus('offline');
    if (error.message === UNAUTHENTICATED_MESSAGE) {
      this.listener.onUnauthenticated();
      return;
    }
    this.retryIfInactive();
  }

  private handleLoss(): void {
    this.listener.onStatus('offline');
    this.retryIfInactive();
  }

  /** Socket.IO ne se reconnecte pas seul après une coupure décidée par le serveur. */
  private retryIfInactive(): void {
    if (this.socket.active) return;
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.socket.connect(), RETRY_DELAY_MILLISECONDS);
  }
}
