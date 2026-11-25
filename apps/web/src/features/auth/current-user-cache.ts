import type { UserResponse } from '@handle-it/contracts';
import type { QueryClient } from '@tanstack/react-query';

export const CURRENT_USER_KEY = ['current-user'];

/** Remplace l'utilisateur et efface les données du précédent. */
export async function replaceCurrentUser(
  queryClient: QueryClient,
  user: UserResponse | null,
): Promise<void> {
  // Une lecture en cours pourrait sinon réécrire l'ancien utilisateur.
  await queryClient.cancelQueries();
  queryClient.setQueryData(CURRENT_USER_KEY, user);
  queryClient.removeQueries({ predicate: ({ queryKey }) => queryKey[0] !== CURRENT_USER_KEY[0] });
}
