import type { UserResponse } from '@handle-it/contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthGateway } from './auth-gateway-context';

const CURRENT_USER_KEY = ['current-user'];
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

/** Remplace l'utilisateur et efface les données du précédent. */
export function useReplaceCurrentUser() {
  const queryClient = useQueryClient();
  return async (user: UserResponse | null) => {
    // Une lecture en cours pourrait sinon réécrire l'ancien utilisateur.
    await queryClient.cancelQueries();
    queryClient.removeQueries({ predicate: ({ queryKey }) => queryKey[0] !== CURRENT_USER_KEY[0] });
    queryClient.setQueryData(CURRENT_USER_KEY, user);
  };
}
