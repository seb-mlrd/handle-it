import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError, type ApiErrorCode } from '../../shared/http/api-error';
import { replaceCurrentUser } from './current-user-cache';

const RETRYABLE_CODES: readonly ApiErrorCode[] = ['UNREACHABLE', 'INTERNAL_ERROR'];
const MAX_RETRIES = 1;

function isRetryable(failureCount: number, error: unknown): boolean {
  return (
    failureCount < MAX_RETRIES &&
    error instanceof ApiError &&
    RETRYABLE_CODES.includes(error.getCode())
  );
}

/** Cache des données ; une session refusée par l'API ramène à la connexion. */
export function createQueryClient(): QueryClient {
  const onError = (error: unknown) => {
    if (error instanceof ApiError && error.getCode() === 'UNAUTHENTICATED') {
      void replaceCurrentUser(queryClient, null);
    }
  };
  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: { queries: { retry: isRetryable } },
  });
  return queryClient;
}
