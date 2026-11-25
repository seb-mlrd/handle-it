import { createContext, useContext } from 'react';
import type { BoardGateway } from './board-gateway';

export const BoardGatewayContext = createContext<BoardGateway | null>(null);

export function useBoardGateway(): BoardGateway {
  const boardGateway = useContext(BoardGatewayContext);
  if (!boardGateway) {
    throw new Error('BoardGatewayContext doit être fourni au-dessus de ce composant');
  }
  return boardGateway;
}
