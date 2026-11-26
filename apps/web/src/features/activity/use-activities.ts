import { useInfiniteQuery } from '@tanstack/react-query';
import { getActivitiesKey } from '../boards/board-keys';
import { useBoardContentGateway } from '../board-view/board-content-gateway-context';

/** Historique d'un board, ou d'une seule carte, page par page. */
export function useActivities(boardId: string, cardId: string | null) {
  const gateway = useBoardContentGateway();
  return useInfiniteQuery({
    queryKey: getActivitiesKey(boardId, cardId),
    queryFn: ({ pageParam }) => gateway.listActivities(boardId, cardId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  });
}
