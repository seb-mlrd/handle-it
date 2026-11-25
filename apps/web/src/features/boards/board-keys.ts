/** Clés de cache partagées par les écrans qui lisent un board. */
export const BOARDS_KEY = ['boards'];

export const getBoardKey = (boardId: string) => [...BOARDS_KEY, boardId];
