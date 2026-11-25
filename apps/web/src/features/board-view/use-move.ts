import type { BoardViewResponse } from '@handle-it/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { useBoardContentGateway } from './board-content-gateway-context';
import { type Columns, describeCardMove, describeColumnMove } from './board-order';
import type { DragItem } from './drag-item';
import { getBoardKey } from './use-board-content';

interface Move {
  readonly item: DragItem;
  readonly columns: Columns;
}

/** Déplacement affiché aussitôt, puis envoyé ; annulé si l'API le refuse. */
export function useMove(boardId: string) {
  const gateway = useBoardContentGateway();
  const queryClient = useQueryClient();
  const boardKey = getBoardKey(boardId);
  const mutationKey = ['move', boardId];
  const boardBeforeMoves = useRef<BoardViewResponse | undefined>(undefined);
  const isLastMove = () => queryClient.isMutating({ mutationKey }) === 1;

  const mutation = useMutation({
    mutationKey,
    // Les déplacements partent un par un : chacun nomme des voisins placés par les précédents.
    scope: { id: mutationKey.join('/') },
    mutationFn: async ({ item, columns }: Move) => {
      if (item.type === 'column') {
        await gateway.moveColumn(boardId, item.id, describeColumnMove(columns, item.id));
        return;
      }
      const request = describeCardMove(columns, item.id);
      if (request) await gateway.moveCard(boardId, item.id, request);
    },
    onError: () => {
      // Un autre déplacement en attente serait effacé à l'écran : la relecture finale tranchera.
      if (isLastMove()) queryClient.setQueryData(boardKey, boardBeforeMoves.current);
    },
    onSettled: () =>
      isLastMove() ? queryClient.invalidateQueries({ queryKey: boardKey, exact: true }) : undefined,
  });

  const move = (item: DragItem, columns: Columns) => {
    // Une lecture en cours ramènerait l'ancien ordre à l'écran.
    void queryClient.cancelQueries({ queryKey: boardKey, exact: true });
    if (queryClient.isMutating({ mutationKey }) === 0) {
      boardBeforeMoves.current = queryClient.getQueryData<BoardViewResponse>(boardKey);
    }
    queryClient.setQueryData<BoardViewResponse>(
      boardKey,
      (board) => board && { ...board, columns: [...columns] },
    );
    mutation.mutate({ item, columns });
  };

  return { move, error: mutation.error };
}
