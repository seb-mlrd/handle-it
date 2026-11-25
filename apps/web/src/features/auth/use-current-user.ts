import type { UserResponse } from '@handle-it/contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthGateway } from './auth-gateway-context';
import { CURRENT_USER_KEY, replaceCurrentUser } from './current-user-cache';

const CURRENT_USER_STALE_MILLISECONDS = 60_000;

/** Utilisateur connecté, ou `null`. */
export function useCurrentUser() {
  const authGateway = useAuthGateway();
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: () => authGateway.getCurrentUser(),
    staleTime: CURRENT_USER_STALE_MILLISECONDS,
  });
}

/** Change d'utilisateur après une connexion ou une déconnexion. */
export function useReplaceCurrentUser() {
  const queryClient = useQueryClient();
  return (user: UserResponse | null) => replaceCurrentUser(queryClient, user);
}
