import { createContext, useContext } from 'react';
import type { BoardContentGateway } from './board-content-gateway';

export const BoardContentGatewayContext = createContext<BoardContentGateway | null>(null);

export function useBoardContentGateway(): BoardContentGateway {
  const boardContentGateway = useContext(BoardContentGatewayContext);
  if (!boardContentGateway) {
    throw new Error('BoardContentGatewayContext doit être fourni au-dessus de ce composant');
  }
  return boardContentGateway;
}
