import { randomUUID } from 'node:crypto';
import type { BoardResponse, ColumnResponse } from '@handle-it/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addMember, registerUser } from '../testing/accounts.js';
import { TestServer } from '../testing/test-server.js';

let server: TestServer;
let ada: string;
let bob: string;
let boardId: string;
let path: string;

async function createBoard(cookie: string): Promise<string> {
  const response = await server.send('POST', '/boards', { cookie, body: { name: 'Maison' } });
  return ((await response.json()) as BoardResponse).id;
}

const create = (name: string, cookie = ada) =>
  server.send('POST', path, { cookie, body: { name } });

const readColumn = async (response: Response) => (await response.json()) as ColumnResponse;

async function listNames(): Promise<string[]> {
  const response = await server.send('GET', path, { cookie: ada });
  return ((await response.json()) as ColumnResponse[]).map(({ name }) => name);
}

beforeEach(async () => {
  server = await TestServer.start();
  ada = await registerUser(server, 'ada');
  bob = await registerUser(server, 'bob');
  boardId = await createBoard(ada);
  path = `/boards/${boardId}/columns`;
});
afterEach(async () => {
  await server.stop();
});

describe('colonnes', () => {
  it('sont créées à la fin et listées dans l’ordre', async () => {
    for (const name of ['À faire', 'En cours', 'Fait']) {
      expect((await create(name)).status).toBe(201);
    }
    expect(await listNames()).toEqual(['À faire', 'En cours', 'Fait']);
  });

  it('sont renommées sans changer de place', async () => {
    const { id } = await readColumn(await create('À faire'));
    await create('Fait');
    const response = await server.send('PATCH', `${path}/${id}`, {
      cookie: ada,
      body: { name: 'Demain' },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id, name: 'Demain' });
    expect(await listNames()).toEqual(['Demain', 'Fait']);
  });

  it('sont supprimées seules, ou avec leur board', async () => {
    const { id } = await readColumn(await create('À faire'));
    await create('Fait');
    expect((await server.send('DELETE', `${path}/${id}`, { cookie: ada })).status).toBe(204);
    expect((await server.send('DELETE', `${path}/${id}`, { cookie: ada })).status).toBe(404);
    expect(await listNames()).toEqual(['Fait']);
    await server.send('DELETE', `/boards/${boardId}`, { cookie: ada });
    expect(await server.getDatabase().column.count()).toBe(0);
  });

  it('restent toutes distinctes après des créations simultanées', async () => {
    const names = ['1', '2', '3', '4', '5', '6'];
    const responses = await Promise.all(names.map((name) => create(name)));
    expect(responses.map(({ status }) => status)).toEqual(names.map(() => 201));
    expect((await listNames()).sort()).toEqual(names);
  });

  it('suivent l’ordre des octets, pas celui d’une langue', async () => {
    const data = [
      { id: randomUUID(), boardId, name: 'minuscule', rank: 'V0000a' },
      { id: randomUUID(), boardId, name: 'majuscule', rank: 'V0000Z' },
    ];
    await server.getDatabase().column.createMany({ data });
    expect(await listNames()).toEqual(['majuscule', 'minuscule']);
  });

  it('refusent deux rangs identiques sur un board', async () => {
    const column = { boardId, name: 'Double', rank: 'V00000' };
    const { column: columns } = server.getDatabase();
    await columns.create({ data: { ...column, id: randomUUID() } });
    const second = columns.create({ data: { ...column, id: randomUUID() } });
    await expect(second).rejects.toMatchObject({ code: 'P2002' });
  });

  it('refusent un nom vide', async () => {
    expect((await create('  ')).status).toBe(400);
  });
});

describe('droits', () => {
  const body = { name: 'Pirate' };

  it('un membre gère les colonnes', async () => {
    await addMember(server, boardId, 'bob');
    const { id } = await readColumn(await create('À faire', bob));
    const options = { cookie: bob, body };
    expect((await server.send('GET', path, { cookie: bob })).status).toBe(200);
    expect((await server.send('PATCH', `${path}/${id}`, options)).status).toBe(200);
    expect((await server.send('DELETE', `${path}/${id}`, { cookie: bob })).status).toBe(204);
  });

  it('un non-membre n’accède à rien', async () => {
    const { id } = await readColumn(await create('À faire'));
    const responses = [
      await server.send('GET', path, { cookie: bob }),
      await create('Pirate', bob),
      await server.send('PATCH', `${path}/${id}`, { cookie: bob, body }),
      await server.send('DELETE', `${path}/${id}`, { cookie: bob }),
    ];
    expect(responses.map(({ status }) => status)).toEqual([404, 404, 404, 404]);
    expect(await listNames()).toEqual(['À faire']);
  });

  it('passer par son propre board ne donne pas accès aux colonnes d’un autre', async () => {
    const { id } = await readColumn(await create('À faire'));
    const bobPath = `/boards/${await createBoard(bob)}/columns/${id}`;
    expect((await server.send('PATCH', bobPath, { cookie: bob, body })).status).toBe(404);
    expect((await server.send('DELETE', bobPath, { cookie: bob })).status).toBe(404);
    expect(await listNames()).toEqual(['À faire']);
  });

  it.each(['GET', 'POST', 'PATCH', 'DELETE'])('%s exige une session', async (method) => {
    const target = method === 'PATCH' || method === 'DELETE' ? `${path}/${randomUUID()}` : path;
    expect((await server.send(method, target)).status).toBe(401);
  });
});
