/** Noms partagés par le serveur et le client temps réel. */
export const REALTIME_PATH = '/api/realtime';

export const REALTIME_MESSAGES = {
  joinBoard: 'join-board',
  boardEvent: 'board-event',
  boardAccessLost: 'board-access-lost',
} as const;
