import type {
  BoardViewResponse,
  ColumnRequest,
  CreateCardRequest,
  LabelRequest,
  SetDueDateRequest,
  UpdateCardRequest,
} from '@handle-it/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBoardKey, getCardKey } from '../boards/board-keys';
import { useBoardContentGateway } from './board-content-gateway-context';

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
  return useContentMutation(
    boardId,
    async (request: UpdateCardRequest) => {
      const card = await gateway.updateCard(boardId, cardId, request);
      queryClient.setQueryData(getCardKey(boardId, cardId), card);
    },
    getCardKey(boardId, cardId),
  );
}

export function useDeleteCard(boardId: string, cardId: string) {
  const gateway = useBoardContentGateway();
  return useContentMutation(
    boardId,
    () => gateway.deleteCard(boardId, cardId),
    getCardKey(boardId, cardId),
  );
}

/** Écriture suivie d'une relecture du board, même en cas d'échec : il a pu changer ailleurs. */
function useContentMutation<Input, Output>(
  boardId: string,
  mutationFn: (input: Input) => Promise<Output>,
  mutationKey: string[] = getBoardKey(boardId),
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey,
    // Les écritures d'un même contenu partent dans l'ordre de saisie.
    scope: { id: mutationKey.join('/') },
    mutationFn,
    // Seul le board est relu : relire une carte supprimée produirait une erreur inutile.
    onSettled: () => queryClient.invalidateQueries({ queryKey: getBoardKey(boardId), exact: true }),
  });
}

export function useCreateLabel(boardId: string) {
  const gateway = useBoardContentGateway();
  return useContentMutation(boardId, (request: LabelRequest) =>
    gateway.createLabel(boardId, request),
  );
}

export function useUpdateLabel(boardId: string, labelId: string) {
  const gateway = useBoardContentGateway();
  return useContentMutation(boardId, (request: LabelRequest) =>
    gateway.updateLabel(boardId, labelId, request),
  );
}

export function useDeleteLabel(boardId: string, labelId: string) {
  const gateway = useBoardContentGateway();
  return useContentMutation(boardId, () => gateway.deleteLabel(boardId, labelId));
}

/** Pose ou retire un label : la case répond aussitôt, l'envoi suit, dans l'ordre des clics. */
export function useSetCardLabel(boardId: string, cardId: string) {
  const gateway = useBoardContentGateway();
  const queryClient = useQueryClient();
  const boardKey = getBoardKey(boardId);
  const mutationKey = [...getCardKey(boardId, cardId), 'labels'];
  return useMutation({
    mutationKey,
    scope: { id: mutationKey.join('/') },
    mutationFn: ({ labelId, isAttached }: { labelId: string; isAttached: boolean }) =>
      gateway.setCardLabel(boardId, cardId, labelId, isAttached),
    onMutate: ({ labelId, isAttached }) => {
      void queryClient.cancelQueries({ queryKey: boardKey, exact: true });
      queryClient.setQueryData<BoardViewResponse>(
        boardKey,
        (board) => board && toggleCardLabel(board, cardId, labelId, isAttached),
      );
    },
    // En cas d'échec comme de réussite, la relecture donne l'état enregistré.
    onSettled: () => queryClient.invalidateQueries({ queryKey: boardKey, exact: true }),
  });
}

function toggleCardLabel(
  board: BoardViewResponse,
  cardId: string,
  labelId: string,
  isAttached: boolean,
): BoardViewResponse {
  const update = (labelIds: readonly string[]) =>
    isAttached ? [...new Set([...labelIds, labelId])] : labelIds.filter((id) => id !== labelId);
  return {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      cards: column.cards.map((card) =>
        card.id === cardId ? { ...card, labelIds: update(card.labelIds) } : card,
      ),
    })),
  };
}

/**
 * Lit le board déjà chargé par sa page, sans jamais le recharger : une relecture lancée par un
 * composant qui apparaît (une carte qui change de colonne, un panneau qui s'ouvre) écraserait un
 * déplacement affiché avant la réponse du serveur.
 */
export function useLoadedBoard<Selected>(
  boardId: string,
  select: (board: BoardViewResponse) => Selected,
) {
  return useQuery({ queryKey: getBoardKey(boardId), enabled: false, select });
}

const selectLabels = (board: BoardViewResponse) => board.labels;

/** Pose, change ou retire l'échéance d'une carte ; le détail ouvert est mis à jour aussitôt. */
export function useSetDueDate(boardId: string, cardId: string) {
  const gateway = useBoardContentGateway();
  const queryClient = useQueryClient();
  return useContentMutation(
    boardId,
    async (request: SetDueDateRequest) => {
      const card = await gateway.setDueDate(boardId, cardId, request);
      queryClient.setQueryData(getCardKey(boardId, cardId), card);
    },
    [...getCardKey(boardId, cardId), 'due-date'],
  );
}

/** Labels du board affiché. */
export function useBoardLabels(boardId: string) {
  return useLoadedBoard(boardId, selectLabels);
}
