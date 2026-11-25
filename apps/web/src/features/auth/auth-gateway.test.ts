import { describe, expect, it } from 'vitest';
import { ApiClient } from '../../shared/http/api-client';
import { AuthGateway } from './auth-gateway';

const createGateway = (code: string, status: number) =>
  new AuthGateway(new ApiClient(async () => Response.json({ code }, { status })));

describe('AuthGateway.getCurrentUser', () => {
  it('renvoie null sans session', async () => {
    expect(await createGateway('UNAUTHENTICATED', 401).getCurrentUser()).toBeNull();
  });

  it('propage les autres erreurs', async () => {
    const request = createGateway('INTERNAL_ERROR', 500).getCurrentUser();
    await expect(request).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
  });
});
