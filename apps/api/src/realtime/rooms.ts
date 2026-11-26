export const getBoardRoom = (boardId: string) => `board:${boardId}`;
export const getUserRoom = (userId: string) => `user:${userId}`;
export const getSessionRoom = (tokenHash: string) => `session:${tokenHash}`;
