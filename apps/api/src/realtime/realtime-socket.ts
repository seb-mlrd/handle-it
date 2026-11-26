import type { BoardAccessLost, BoardEventEnvelope } from '@handle-it/contracts';
import type { DefaultEventsMap, Server, Socket } from 'socket.io';

interface ClientEvents {
  // Rien de ce qu'envoie un client n'est sûr : tout est validé à la réception.
  readonly 'join-board': (request: unknown, reply: unknown) => void;
}

interface ServerEvents {
  readonly 'board-event': (envelope: BoardEventEnvelope) => void;
  readonly 'board-access-lost': (lost: BoardAccessLost) => void;
}

/** Identité attachée à une connexion lors de son authentification. */
export interface SocketIdentity {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export type RealtimeServer = Server<ClientEvents, ServerEvents, DefaultEventsMap, SocketIdentity>;
export type RealtimeSocket = Socket<ClientEvents, ServerEvents, DefaultEventsMap, SocketIdentity>;
