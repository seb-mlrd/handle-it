/** Clés de cache partagées par les écrans qui lisent un board. */
export const BOARDS_KEY = ['boards'];

export const getBoardKey = (boardId: string) => [...BOARDS_KEY, boardId];

export const getCardKey = (boardId: string, cardId: string) => [
  ...getBoardKey(boardId),
  'cards',
  cardId,
];

export const getMoveKey = (boardId: string) => ['move', boardId];

/** Historique du board (`cardId` nul) ou d'une carte. */
export const getActivitiesKey = (boardId: string, cardId: string | null) => [
  ...getBoardKey(boardId),
  'activities',
  cardId ?? 'board',
];

/** Fil de commentaires d'une carte ; relu avec la carte quand elle change. */
export const getCommentsKey = (boardId: string, cardId: string) => [
  ...getCardKey(boardId, cardId),
  'comments',
];
