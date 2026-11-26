import { randomUUID } from 'node:crypto';
import type { ActivityDetails, ActivityPageResponse } from '@handle-it/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addMember, registerUser } from '../testing/accounts.js';
import { BoardFixture } from '../testing/board-fixture.js';
import { TestServer } from '../testing/test-server.js';

let server: TestServer;
let ada: string;
let bob: string;
let board: BoardFixture;

const send = (method: string, path: string, body?: unknown, cookie = ada) =>
  server.send(method, `${board.getPath()}${path}`, { cookie, body });

async function readPage(path = '/activities', cookie = ada): Promise<ActivityPageResponse> {
  return (await (await send('GET', path, undefined, cookie)).json()) as ActivityPageResponse;
}

/** Historique du plus ancien au plus récent, lisible d'un coup d'œil. */
async function readHistory(
  path?: string,
): Promise<{ actor: string | null; details: ActivityDetails }[]> {
  const { items } = await readPage(path);
  return items.map(({ actorName, details }) => ({ actor: actorName, details })).reverse();
}

const userId = async (name: string) =>
  (await server.getDatabase().user.findUniqueOrThrow({ where: { email: `${name}@example.com` } }))
    .id;

beforeEach(async () => {
  server = await TestServer.start();
  ada = await registerUser(server, 'ada');
  bob = await registerUser(server, 'bob');
  board = await BoardFixture.create(server, ada);
});
afterEach(async () => {
  await server.stop();
});

describe('historique', () => {
  it('décrit chaque modification avec son auteur et les noms du moment', async () => {
    const columnA = await board.addColumn('A');
    const columnB = await board.addColumn('B');
    const card = await board.addCard(columnA, 'Pain');
    await send('PATCH', `/cards/${card}`, { title: 'Pain complet', description: 'secret' });
    await send('PATCH', `/cards/${card}/position`, {
      columnId: columnB,
      previousCardId: null,
      nextCardId: null,
    });
    await send('PATCH', `/columns/${columnB}/position`, {
      previousColumnId: null,
      nextColumnId: columnA,
    });
    await send('PATCH', `/columns/${columnA}`, { name: 'À faire' });
    await send('DELETE', `/cards/${card}`);
    await send('DELETE', `/columns/${columnB}`);
    await send('PATCH', '', { name: 'Maison' });
    expect(await readHistory()).toEqual([
      { actor: 'ada', details: { type: 'column-created', columnName: 'A' } },
      { actor: 'ada', details: { type: 'column-created', columnName: 'B' } },
      { actor: 'ada', details: { type: 'card-created', cardTitle: 'Pain', columnName: 'A' } },
      { actor: 'ada', details: { type: 'card-updated', cardTitle: 'Pain complet' } },
      { actor: 'ada', details: { type: 'card-moved', cardTitle: 'Pain complet', columnName: 'B' } },
      { actor: 'ada', details: { type: 'column-moved', columnName: 'B' } },
      { actor: 'ada', details: { type: 'column-renamed', columnName: 'À faire' } },
      { actor: 'ada', details: { type: 'card-deleted', cardTitle: 'Pain complet' } },
      { actor: 'ada', details: { type: 'column-deleted', columnName: 'B' } },
      { actor: 'ada', details: { type: 'board-renamed', boardName: 'Maison' } },
    ]);
    expect(JSON.stringify(await readPage())).not.toContain('secret');
  });

  it('suit les arrivées et les départs de membres', async () => {
    const response = await send('POST', '/invitations', { duration: 'one-day' });
    const { token } = (await response.json()) as { token: string };
    await server.send('POST', '/invitations/accept', { cookie: bob, body: { token } });
    await send('DELETE', `/members/${await userId('bob')}`);
    const eve = await registerUser(server, 'eve');
    await addMember(server, board.getId(), 'eve');
    await send('DELETE', '/membership', undefined, eve);
    expect(await readHistory()).toEqual([
      { actor: 'bob', details: { type: 'member-joined' } },
      { actor: 'ada', details: { type: 'member-removed', memberName: 'bob' } },
      { actor: 'eve', details: { type: 'member-left' } },
    ]);
  });

  it('n’écrit rien pour une modification refusée ou en échec', async () => {
    await addMember(server, board.getId(), 'bob');
    await send('PATCH', '', { name: 'Pirate' }, bob);
    await send('DELETE', `/columns/${randomUUID()}`);
    await send('DELETE', `/members/${await userId('ada')}`);
    expect(await readHistory()).toEqual([]);
  });

  it('se limite à une carte, même supprimée, et ne mélange pas les boards', async () => {
    const column = await board.addColumn('A');
    const card = await board.addCard(column, 'Pain');
    await board.addCard(column, 'Lait');
    await send('DELETE', `/cards/${card}`);
    const other = await BoardFixture.create(server, ada);
    await other.addColumn('Ailleurs');
    const types = (await readHistory(`/cards/${card}/activities`)).map(
      ({ details }) => details.type,
    );
    expect(types).toEqual(['card-created', 'card-deleted']);
    expect(await readHistory()).toHaveLength(4);
  });

  it('se lit page par page sans doublon ni oubli', async () => {
    const column = await board.addColumn('A');
    for (let index = 0; index < 34; index += 1) await board.addCard(column, `Carte ${index}`);
    const first = await readPage();
    expect(first.items).toHaveLength(30);
    expect(first.nextCursor).not.toBeNull();
    const second = await readPage(`/activities?before=${first.nextCursor}`);
    expect(second.items).toHaveLength(5);
    expect(second.nextCursor).toBeNull();
    const ids = [...first.items, ...second.items].map(({ id }) => id);
    expect(new Set(ids).size).toBe(35);
  });

  it('garde l’entrée d’un compte supprimé, sans nom', async () => {
    await addMember(server, board.getId(), 'bob');
    await board.addColumn('A');
    await send('POST', '/columns', { name: 'De Bob' }, bob);
    await server.getDatabase().user.delete({ where: { id: await userId('bob') } });
    expect((await readHistory()).map(({ actor }) => actor)).toEqual(['ada', null]);
  });

  it('refuse un curseur inventé et reste réservé aux membres', async () => {
    expect((await send('GET', '/activities?before=abc')).status).toBe(400);
    expect((await send('GET', '/activities', undefined, bob)).status).toBe(404);
    expect((await send('GET', `/cards/${randomUUID()}/activities`, undefined, bob)).status).toBe(
      404,
    );
    expect((await send('GET', '/activities', undefined, '')).status).toBe(401);
  });
});
