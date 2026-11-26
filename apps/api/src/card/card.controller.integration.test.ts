import { randomUUID } from 'node:crypto';
import type { BoardViewResponse, CardResponse } from '@handle-it/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addMember, registerUser } from '../testing/accounts.js';
import { TestServer } from '../testing/test-server.js';

let server: TestServer;
let ada: string;
let bob: string;
let boardPath: string;
let columnPath: string;

async function createAt(path: string, body: unknown, cookie: string): Promise<string> {
  const response = await server.send('POST', path, { cookie, body });
  return ((await response.json()) as { id: string }).id;
}

const createCard = (title: string, cookie = ada, path = columnPath) =>
  server.send('POST', `${path}/cards`, { cookie, body: { title } });

const readCard = async (response: Response) => (await response.json()) as CardResponse;

async function readView(cookie = ada): Promise<BoardViewResponse> {
  const response = await server.send('GET', boardPath, { cookie });
  return (await response.json()) as BoardViewResponse;
}

const readTitles = async () =>
  (await readView()).columns.map(({ cards }) => cards.map(({ title }) => title));

beforeEach(async () => {
  server = await TestServer.start();
  ada = await registerUser(server, 'ada');
  bob = await registerUser(server, 'bob');
  boardPath = `/boards/${await createAt('/boards', { name: 'Maison' }, ada)}`;
  const columnId = await createAt(`${boardPath}/columns`, { name: 'À faire' }, ada);
  columnPath = `${boardPath}/columns/${columnId}`;
});
afterEach(async () => {
  await server.stop();
});

describe('vue du board', () => {
  it('renvoie colonnes et cartes dans l’ordre, sans les descriptions', async () => {
    await createAt(`${boardPath}/columns`, { name: 'Fait' }, ada);
    await createCard('Pain');
    await createCard('Lait');
    expect(await readView()).toEqual({
      id: expect.any(String),
      name: 'Maison',
      role: 'owner',
      version: 4,
      columns: [
        {
          id: expect.any(String),
          name: 'À faire',
          cards: [
            { id: expect.any(String), title: 'Pain' },
            { id: expect.any(String), title: 'Lait' },
          ],
        },
        { id: expect.any(String), name: 'Fait', cards: [] },
      ],
    });
  });

  it('ne mélange pas les boards', async () => {
    const otherPath = `/boards/${await createAt('/boards', { name: 'Autre' }, ada)}`;
    const otherColumn = await createAt(`${otherPath}/columns`, { name: 'Autre' }, ada);
    await createCard('Ailleurs', ada, `${otherPath}/columns/${otherColumn}`);
    expect(await readTitles()).toEqual([[]]);
  });

  it('est réservée aux membres', async () => {
    expect((await server.send('GET', boardPath, { cookie: bob })).status).toBe(404);
    await addMember(server, (await readView()).id, 'bob');
    expect((await readView(bob)).role).toBe('member');
    expect((await server.send('GET', boardPath)).status).toBe(401);
  });
});

describe('cartes', () => {
  it('sont créées sans description, puis modifiées', async () => {
    const response = await createCard('Pain');
    expect(response.status).toBe(201);
    const card = await readCard(response);
    expect(card).toEqual({ id: expect.any(String), title: 'Pain', description: '' });
    const body = { title: 'Pain complet', description: 'Deux\nbaguettes' };
    const cardPath = `${boardPath}/cards/${card.id}`;
    const updated = await server.send('PATCH', cardPath, { cookie: ada, body });
    expect(updated.status).toBe(200);
    const read = await server.send('GET', cardPath, { cookie: ada });
    expect(await read.json()).toEqual({ id: card.id, ...body });
  });

  it('sont supprimées seules, ou avec leur colonne', async () => {
    const { id } = await readCard(await createCard('Pain'));
    await createCard('Lait');
    const cardPath = `${boardPath}/cards/${id}`;
    expect((await server.send('DELETE', cardPath, { cookie: ada })).status).toBe(204);
    expect((await server.send('GET', cardPath, { cookie: ada })).status).toBe(404);
    expect(await readTitles()).toEqual([['Lait']]);
    await server.send('DELETE', columnPath, { cookie: ada });
    expect(await server.getDatabase().card.count()).toBe(0);
  });

  it('restent toutes distinctes après des créations simultanées', async () => {
    const titles = ['1', '2', '3', '4', '5', '6'];
    const responses = await Promise.all(titles.map((title) => createCard(title)));
    expect(responses.map(({ status }) => status)).toEqual(titles.map(() => 201));
    expect((await readTitles())[0]?.sort()).toEqual(titles);
  });

  it('refusent deux rangs identiques dans une colonne', async () => {
    const columnId = columnPath.split('/').at(-1) ?? '';
    const card = { columnId, title: 'Double', description: '', rank: 'V00000' };
    const { card: cards } = server.getDatabase();
    await cards.create({ data: { ...card, id: randomUUID() } });
    const second = cards.create({ data: { ...card, id: randomUUID() } });
    await expect(second).rejects.toMatchObject({ code: 'P2002' });
  });

  it('refusent un titre vide', async () => {
    expect((await createCard('  ')).status).toBe(400);
  });
});

describe('droits', () => {
  const body = { title: 'Pirate', description: '' };

  async function attemptAll(base: string, cardId: string, column = columnPath) {
    const path = `${base}/cards/${cardId}`;
    const responses = [
      await createCard('Pirate', bob, column),
      await server.send('GET', path, { cookie: bob }),
      await server.send('PATCH', path, { cookie: bob, body }),
      await server.send('DELETE', path, { cookie: bob }),
    ];
    return responses.map(({ status }) => status);
  }

  it('un membre gère les cartes', async () => {
    await addMember(server, (await readView()).id, 'bob');
    const { id } = await readCard(await createCard('Pain'));
    expect(await attemptAll(boardPath, id)).toEqual([201, 200, 200, 204]);
  });

  it('un non-membre n’accède à rien', async () => {
    const { id } = await readCard(await createCard('Pain'));
    expect(await attemptAll(boardPath, id)).toEqual([404, 404, 404, 404]);
    expect(await readTitles()).toEqual([['Pain']]);
  });

  it('passer par son propre board ne donne pas accès aux cartes d’un autre', async () => {
    const { id } = await readCard(await createCard('Pain'));
    const bobPath = `/boards/${await createAt('/boards', { name: 'À Bob' }, bob)}`;
    const adaColumnId = columnPath.split('/').at(-1);
    const statuses = await attemptAll(bobPath, id, `${bobPath}/columns/${adaColumnId}`);
    expect(statuses).toEqual([404, 404, 404, 404]);
    expect(await readTitles()).toEqual([['Pain']]);
  });

  it.each(['GET', 'PATCH', 'DELETE'])('%s exige une session', async (method) => {
    const response = await server.send(method, `${boardPath}/cards/${randomUUID()}`);
    expect(response.status).toBe(401);
  });

  it('créer exige une session', async () => {
    expect((await server.send('POST', `${columnPath}/cards`)).status).toBe(401);
  });
});
