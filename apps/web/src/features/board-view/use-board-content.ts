import type { ColumnRequest, CreateCardRequest, UpdateCardRequest } from '@handle-it/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBoardContentGateway } from './board-content-gateway-context';

const getBoardKey = (boardId: string) => ['boards', boardId];
const getCardKey = (boardId: string, cardId: string) => ['boards', boardId, 'cards', cardId];

export function useBoardView(boardId: string) {
  const gateway = useBoardContentGateway();
  return useQuery({ queryKey: getBoardKey(boardId), queryFn: () => gateway.getBoard(boardId) });
}

export function useCard(boardId: string, cardId: string) {
  const gateway = useBoardContentGateway();
  return useQuery({
    queryKey: getCardKey(boardId, cardId),
    queryFn: () => gateway.getCard(boardId, cardId),
  });
}

export function useCreateColumn(boardId: string) {
  const gateway = useBoardContentGateway();
  return useContentMutation(boardId, (request: ColumnRequest) =>
    gateway.createColumn(boardId, request),
  );
}

export function useRenameColumn(boardId: string, columnId: string) {
  const gateway = useBoardContentGateway();
  return useContentMutation(boardId, (request: ColumnRequest) =>
    gateway.renameColumn(boardId, columnId, request),
  );
}

export function useDeleteColumn(boardId: string, columnId: string) {
  const gateway = useBoardContentGateway();
  return useContentMutation(boardId, () => gateway.deleteColumn(boardId, columnId));
}

export function useCreateCard(boardId: string, columnId: string) {
  const gateway = useBoardContentGateway();
  return useContentMutation(boardId, (request: CreateCardRequest) =>
    gateway.createCard(boardId, columnId, request),
  );
}

export function useUpdateCard(boardId: string, cardId: string) {
  const gateway = useBoardContentGateway();
  const queryClient = useQueryClient();
  return useContentMutation(boardId, async (request: UpdateCardRequest) => {
    const card = await gateway.updateCard(boardId, cardId, request);
    queryClient.setQueryData(getCardKey(boardId, cardId), card);
  });
}

export function useDeleteCard(boardId: string, cardId: string) {
  const gateway = useBoardContentGateway();
  return useContentMutation(boardId, () => gateway.deleteCard(boardId, cardId));
}

/** Écriture suivie d'une relecture du board, même en cas d'échec : il a pu changer ailleurs. */
function useContentMutation<Input, Output>(
  boardId: string,
  mutationFn: (input: Input) => Promise<Output>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    // Seul le board est relu : relire une carte supprimée produirait une erreur inutile.
    onSettled: () => queryClient.invalidateQueries({ queryKey: getBoardKey(boardId), exact: true }),
  });
}
