import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BOARDS_KEY } from '../boards/board-keys';
import { useMemberGateway } from '../members/member-gateway-context';

export function useInvitationPreview(token: string) {
  const gateway = useMemberGateway();
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () => gateway.previewInvitation(token),
    // Un lien peut expirer ou servir entre deux visites.
    gcTime: 0,
  });
}

export function useAcceptInvitation(token: string) {
  const gateway = useMemberGateway();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gateway.acceptInvitation(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOARDS_KEY }),
  });
}
