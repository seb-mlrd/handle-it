import {
  type BoardAccessLost,
  type BoardEventEnvelope,
  boardEventEnvelopeSchema,
  type JoinBoardResponse,
  REALTIME_MESSAGES,
  REALTIME_PATH,
} from '@handle-it/contracts';
import { io, type Socket } from 'socket.io-client';
import { type TestServer, WEB_ORIGIN } from './test-server.js';

const ACKNOWLEDGEMENT_TIMEOUT_MILLISECONDS = 2000;

/** Client temps réel minimal, qui garde tout ce qu'il reçoit. */
export class RealtimeClient {
  readonly envelopes: BoardEventEnvelope[] = [];
  readonly lostAccesses: BoardAccessLost[] = [];

  private constructor(private readonly socket: Socket) {
    socket.on(REALTIME_MESSAGES.boardEvent, (envelope: unknown) =>
      this.envelopes.push(boardEventEnvelopeSchema.parse(envelope)),
    );
    socket.on(REALTIME_MESSAGES.boardAccessLost, (lost: BoardAccessLost) =>
      this.lostAccesses.push(lost),
    );
  }

  /** Échoue si le serveur refuse la connexion. */
  static async connect(
    server: TestServer,
    cookie: string,
    origin = WEB_ORIGIN,
  ): Promise<RealtimeClient> {
    const socket = io(server.getUrl(), {
      path: REALTIME_PATH,
      transports: ['websocket'],
      reconnection: false,
      extraHeaders: { cookie, origin },
      forceNew: true,
    });
    const client = new RealtimeClient(socket);
    await new Promise<void>((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });
    return client;
  }

  join(request: unknown): Promise<JoinBoardResponse> {
    return this.socket
      .timeout(ACKNOWLEDGEMENT_TIMEOUT_MILLISECONDS)
      .emitWithAck(REALTIME_MESSAGES.joinBoard, request) as Promise<JoinBoardResponse>;
  }

  emit(message: string, ...values: unknown[]): void {
    this.socket.emit(message, ...values);
  }

  isConnected(): boolean {
    return this.socket.connected;
  }

  close(): void {
    this.socket.close();
  }
}
