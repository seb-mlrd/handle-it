import type { CreateInvitationRequest } from '@handle-it/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BOARDS_KEY, getBoardKey } from '../boards/board-keys';
import { useMemberGateway } from './member-gateway-context';

const getMembersKey = (boardId: string) => [...getBoardKey(boardId), 'members'];
const getInvitationsKey = (boardId: string) => [...getBoardKey(boardId), 'invitations'];

export function useMembers(boardId: string) {
  const gateway = useMemberGateway();
  return useQuery({
    queryKey: getMembersKey(boardId),
    queryFn: () => gateway.listMembers(boardId),
  });
}

export function useInvitations(boardId: string) {
  const gateway = useMemberGateway();
  return useQuery({
    queryKey: getInvitationsKey(boardId),
    queryFn: () => gateway.listInvitations(boardId),
  });
}

export function useRemoveMember(boardId: string, userId: string) {
  const gateway = useMemberGateway();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gateway.removeMember(boardId, userId),
    // Retirer un membre annule aussi les invitations.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: getMembersKey(boardId) }),
        queryClient.invalidateQueries({ queryKey: getInvitationsKey(boardId) }),
      ]),
  });
}

export function useCreateInvitation(boardId: string) {
  const gateway = useMemberGateway();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateInvitationRequest) => gateway.createInvitation(boardId, request),
    onSettled: () => queryClient.invalidateQueries({ queryKey: getInvitationsKey(boardId) }),
  });
}

/** Quitte le board ; l'appelant doit d'abord s'en éloigner pour ne pas le relire sans y avoir accès. */
export function useLeaveBoard(boardId: string, moveAway: () => Promise<void> | void) {
  const gateway = useMemberGateway();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gateway.leaveBoard(boardId),
    onSuccess: async () => {
      await moveAway();
      queryClient.removeQueries({ queryKey: getBoardKey(boardId) });
      await queryClient.invalidateQueries({ queryKey: BOARDS_KEY, exact: true });
    },
  });
}
