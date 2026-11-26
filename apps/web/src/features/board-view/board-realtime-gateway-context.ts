import { createContext, useContext } from 'react';
import type { BoardRealtimeGateway } from './board-realtime-gateway';

export const BoardRealtimeGatewayContext = createContext<BoardRealtimeGateway | null>(null);

export function useBoardRealtimeGateway(): BoardRealtimeGateway {
  const gateway = useContext(BoardRealtimeGatewayContext);
  if (!gateway) {
    throw new Error('BoardRealtimeGatewayContext doit être fourni au-dessus de ce composant');
  }
  return gateway;
}
