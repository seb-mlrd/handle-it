import { describe, expect, it, vi } from 'vitest';
import { ApiError, type ApiErrorCode } from '../../shared/http/api-error';
import { createQueryClient } from './create-query-client';
import { CURRENT_USER_KEY } from './current-user-cache';

async function failQuery(code: ApiErrorCode) {
  const queryClient = createQueryClient();
  queryClient.setQueryData(CURRENT_USER_KEY, { id: 'ada' });
  queryClient.setQueryData(['secret'], 'donnée');
  const queryFn = vi.fn(() => Promise.reject(new ApiError(code)));
  await queryClient.fetchQuery({ queryKey: ['test'], queryFn, retryDelay: 0 }).catch(() => null);
  return { queryClient, queryFn };
}

describe('createQueryClient', () => {
  it('oublie l’utilisateur et ses données quand la session est refusée', async () => {
    const { queryClient } = await failQuery('UNAUTHENTICATED');
    await vi.waitFor(() => expect(queryClient.getQueryData(CURRENT_USER_KEY)).toBeNull());
    expect(queryClient.getQueryData(['secret'])).toBeUndefined();
  });

  it('garde l’utilisateur pour une autre erreur, sans réessayer un refus', async () => {
    const { queryClient, queryFn } = await failQuery('FORBIDDEN');
    expect(queryClient.getQueryData(CURRENT_USER_KEY)).toEqual({ id: 'ada' });
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it('réessaie une fois un serveur injoignable', async () => {
    const { queryFn } = await failQuery('UNREACHABLE');
    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});
