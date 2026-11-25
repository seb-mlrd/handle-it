import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiClient } from './api-client';

const SCHEMA = z.object({ name: z.string() });

function createClient(answer: () => Promise<Response>) {
  const fetchRequest = vi.fn<typeof fetch>(answer);
  return { client: new ApiClient(fetchRequest), fetchRequest };
}

const readError = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: unknown) => error,
  );

describe('ApiClient', () => {
  it('envoie du JSON avec un délai et valide la réponse', async () => {
    const { client, fetchRequest } = createClient(async () => Response.json({ name: 'Ada' }));
    expect(await client.post('/test', { id: 1 }, SCHEMA)).toEqual({ name: 'Ada' });
    const [url, options] = fetchRequest.mock.calls[0] ?? [];
    expect(url).toBe('/api/test');
    expect(options).toMatchObject({ method: 'POST', body: '{"id":1}' });
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  it('accepte une réponse vide', async () => {
    const { client } = createClient(async () => new Response(null, { status: 204 }));
    await expect(client.postWithoutResult('/test')).resolves.toBeUndefined();
  });

  it("transmet le code et les champs d'une erreur", async () => {
    const body = { code: 'INVALID_REQUEST', fieldErrors: { email: ['invalide'] } };
    const { client } = createClient(async () => Response.json(body, { status: 400 }));
    expect(await readError(client.get('/test', SCHEMA))).toMatchObject(body);
  });

  it.each([
    ['réseau coupé', () => Promise.reject(new TypeError('réseau'))],
    ['erreur HTML du proxy', async () => new Response('<html>', { status: 502 })],
    ['réponse inattendue', async () => Response.json({ autre: 1 })],
  ])('signale un serveur injoignable : %s', async (_case, answer) => {
    const { client } = createClient(answer);
    expect(await readError(client.get('/test', SCHEMA))).toMatchObject({ code: 'UNREACHABLE' });
  });
});
