import type { BoardViewResponse } from '@handle-it/contracts';
import { useIsFetching, useIsMutating, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { replaceCurrentUser } from '../auth/current-user-cache';
import { getBoardKey, getMoveKey } from '../boards/board-keys';
import { useBoardRealtimeGateway } from './board-realtime-gateway-context';
import type { ConnectionStatus } from './board-realtime-gateway';
import { BoardSynchronizer } from './board-synchronizer';

/** Suit un board en direct et renvoie l'état de la connexion. */
export function useBoardRealtime(board: BoardViewResponse): ConnectionStatus {
  const boardId = board.id;
  const gateway = useBoardRealtimeGateway();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const synchronizer = useMemo(
    () => new BoardSynchronizer(queryClient, boardId),
    [queryClient, boardId],
  );

  useEffect(
    () =>
      gateway.follow(boardId, {
        onStatus: setStatus,
        onEnvelope: (envelope) => synchronizer.receive(envelope),
        onJoined: (version, isReconnection) => {
          if (isReconnection) synchronizer.reloadEverything();
          synchronizer.noteVersion(version);
        },
        onAccessLost: () => synchronizer.reload(),
        onUnreadable: () => synchronizer.reload(),
        onUnauthenticated: () => void replaceCurrentUser(queryClient, null),
      }),
    [gateway, queryClient, synchronizer, boardId],
  );

  const isFetching = useIsFetching({ queryKey: getBoardKey(boardId), exact: true }) > 0;
  const isMoving = useIsMutating({ mutationKey: getMoveKey(boardId) }) > 0;
  // Dès qu'une lecture ou un déplacement se termine, les événements mis de côté sont rattrapés.
  useEffect(() => {
    if (!isFetching && !isMoving) synchronizer.catchUp();
  }, [synchronizer, isFetching, isMoving, board.version]);

  return status;
}
