import type { BoardRequest } from '@handle-it/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BOARDS_KEY } from './board-keys';
import { useBoardGateway } from './board-gateway-context';

/** Boards de l'utilisateur connecté. */
export function useBoards() {
  const boardGateway = useBoardGateway();
  return useQuery({ queryKey: BOARDS_KEY, queryFn: () => boardGateway.list() });
}

export function useCreateBoard() {
  const boardGateway = useBoardGateway();
  return useBoardMutation((request: BoardRequest) => boardGateway.create(request));
}

export function useRenameBoard(boardId: string) {
  const boardGateway = useBoardGateway();
  return useBoardMutation((request: BoardRequest) => boardGateway.rename(boardId, request));
}

export function useDeleteBoard(boardId: string) {
  const boardGateway = useBoardGateway();
  return useBoardMutation(() => boardGateway.delete(boardId));
}

/** Écriture suivie d'une relecture de la liste, même en cas d'échec : elle a pu changer ailleurs. */
function useBoardMutation<Input, Output>(mutationFn: (input: Input) => Promise<Output>) {
  const queryClient = useQueryClient();
  return useMutation({
    // Les écritures partent dans l'ordre de saisie.
    scope: { id: BOARDS_KEY.join('/') },
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: BOARDS_KEY }),
  });
}
