import type { CommentRequest } from '@handle-it/contracts';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBoardKey, getCommentsKey } from '../boards/board-keys';
import { useCommentGateway } from './comment-gateway-context';

/** Fil d'une carte, page par page. */
export function useComments(boardId: string, cardId: string) {
  const gateway = useCommentGateway();
  return useInfiniteQuery({
    queryKey: getCommentsKey(boardId, cardId),
    queryFn: ({ pageParam }) => gateway.list(boardId, cardId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  });
}

export function useAddComment(boardId: string, cardId: string) {
  const gateway = useCommentGateway();
  return useCommentMutation(boardId, cardId, (request: CommentRequest) =>
    gateway.add(boardId, cardId, request),
  );
}

export function useUpdateComment(boardId: string, cardId: string, commentId: string) {
  const gateway = useCommentGateway();
  return useCommentMutation(boardId, cardId, (request: CommentRequest) =>
    gateway.update(boardId, commentId, request),
  );
}

export function useDeleteComment(boardId: string, cardId: string, commentId: string) {
  const gateway = useCommentGateway();
  return useCommentMutation(boardId, cardId, () => gateway.delete(boardId, commentId));
}

/** Écriture suivie d'une relecture du fil et du board, même en cas d'échec : ils ont pu changer. */
function useCommentMutation<Input, Output>(
  boardId: string,
  cardId: string,
  mutationFn: (input: Input) => Promise<Output>,
) {
  const queryClient = useQueryClient();
  const commentsKey = getCommentsKey(boardId, cardId);
  return useMutation({
    mutationKey: commentsKey,
    // Les écritures d'un même fil partent dans l'ordre de saisie.
    scope: { id: commentsKey.join('/') },
    mutationFn,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: commentsKey }),
        queryClient.invalidateQueries({ queryKey: getBoardKey(boardId), exact: true }),
      ]),
  });
}
