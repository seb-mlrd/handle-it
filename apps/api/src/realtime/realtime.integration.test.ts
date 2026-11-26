import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addMember, registerUser } from '../testing/accounts.js';
import { BoardFixture } from '../testing/board-fixture.js';
import { RealtimeClient } from '../testing/realtime-client.js';
import { TestServer } from '../testing/test-server.js';

const SETTLE_MILLISECONDS = 150;

let server: TestServer;
let ada: string;
let bob: string;
let board: BoardFixture;
let clients: RealtimeClient[];

async function connect(cookie: string, origin?: string): Promise<RealtimeClient> {
  const client = await RealtimeClient.connect(server, cookie, origin);
  clients.push(client);
  return client;
}

async function follow(cookie: string): Promise<RealtimeClient> {
  const client = await connect(cookie);
  expect(await client.join({ boardId: board.getId() })).toMatchObject({ status: 'joined' });
  return client;
}

const send = (method: string, path: string, body?: unknown, cookie = ada) =>
  server.send(method, `${board.getPath()}${path}`, { cookie, body });

const settle = () => new Promise((resolve) => setTimeout(resolve, SETTLE_MILLISECONDS));

async function findUserId(name: string): Promise<string> {
  const where = { email: `${name}@example.com` };
  return (await server.getDatabase().user.findUniqueOrThrow({ where })).id;
}

beforeEach(async () => {
  clients = [];
  server = await TestServer.start();
  ada = await registerUser(server, 'ada');
  bob = await registerUser(server, 'bob');
  board = await BoardFixture.create(server, ada);
});
afterEach(async () => {
  clients.forEach((client) => client.close());
  await server.stop();
});

describe('connexion', () => {
  it.each(['', 'session=faux'])('est refusée avec le cookie « %s »', async (cookie) => {
    await expect(connect(cookie)).rejects.toThrow('UNAUTHENTICATED');
  });

  it('est refusée depuis une autre origine', async () => {
    await expect(connect(ada, 'https://pirate.example')).rejects.toThrow();
  });

  it('est coupée à la déconnexion, sans toucher aux autres sessions', async () => {
    const response = await server.send('POST', '/auth/login', {
      body: { email: 'ada@example.com', password: 'mot-de-passe-long' },
    });
    const otherCookie = response.headers.get('set-cookie')?.split(';')[0] ?? '';
    const [client, other] = [await connect(ada), await connect(otherCookie)];
    await server.send('POST', '/auth/logout', { cookie: ada });
    await vi.waitFor(() => expect(client.isConnected()).toBe(false));
    expect(other.isConnected()).toBe(true);
  });

  it('est coupée à l’expiration de la session', async () => {
    await server
      .getDatabase()
      .session.updateMany({ data: { expiresAt: new Date(Date.now() + 600) } });
    const client = await connect(ada);
    expect(client.isConnected()).toBe(true);
    await vi.waitFor(() => expect(client.isConnected()).toBe(false), { timeout: 2000 });
  });
});

describe('entrée sur un board', () => {
  it('renvoie la version courante', async () => {
    await board.addColumn('A');
    const client = await connect(ada);
    expect(await client.join({ boardId: board.getId() })).toEqual({ status: 'joined', version: 1 });
  });

  it('est refusée à un non-membre, qui ne reçoit rien', async () => {
    const client = await connect(bob);
    expect(await client.join({ boardId: board.getId() })).toEqual({ status: 'refused' });
    await board.addColumn('A');
    await settle();
    expect(client.envelopes).toEqual([]);
  });

  it.each([undefined, {}, { boardId: 'abc' }, { boardId: randomUUID() }])(
    'refuse la demande %j',
    async (request) => {
      expect(await (await connect(ada)).join(request)).toEqual({ status: 'refused' });
    },
  );

  it('survit à un message sans accusé de réception', async () => {
    const client = await connect(ada);
    client.emit('join-board', { boardId: board.getId() }, 'pas une fonction');
    client.emit('message-inconnu');
    await settle();
    expect(client.isConnected()).toBe(true);
  });
});

describe('événements', () => {
  it('décrivent chaque modification, versions sans trou', async () => {
    const client = await follow(ada);
    const columnA = await board.addColumn('A');
    const columnB = await board.addColumn('B');
    const first = await board.addCard(columnA, 'un');
    const second = await board.addCard(columnA, 'deux');
    await send('PATCH', `/cards/${second}/position`, {
      columnId: columnA,
      previousCardId: null,
      nextCardId: first,
    });
    await send('PATCH', `/cards/${first}/position`, {
      columnId: columnB,
      previousCardId: null,
      nextCardId: null,
    });
    await send('PATCH', `/columns/${columnB}/position`, {
      previousColumnId: null,
      nextColumnId: columnA,
    });
    await send('PATCH', `/columns/${columnA}/position`, {
      previousColumnId: columnB,
      nextColumnId: null,
    });
    await send('PATCH', `/columns/${columnA}`, { name: 'A2' });
    await send('PATCH', `/cards/${first}`, { title: 'un bis', description: 'secret' });
    await send('DELETE', `/cards/${first}`);
    await send('DELETE', `/columns/${columnB}`);
    await send('PATCH', '', { name: 'Nouveau' });
    await send('DELETE', '');
    await vi.waitFor(() => expect(client.envelopes).toHaveLength(14));
    expect(client.envelopes.map(({ version }) => version)).toEqual(
      Array.from({ length: 14 }, (_, index) => index + 1),
    );
    expect(client.envelopes.map(({ event }) => event)).toEqual([
      { type: 'column-created', column: { id: columnA, name: 'A' } },
      { type: 'column-created', column: { id: columnB, name: 'B' } },
      { type: 'card-created', columnId: columnA, card: { id: first, title: 'un' } },
      { type: 'card-created', columnId: columnA, card: { id: second, title: 'deux' } },
      { type: 'card-moved', cardId: second, columnId: columnA, previousCardId: null },
      { type: 'card-moved', cardId: first, columnId: columnB, previousCardId: null },
      { type: 'column-moved', columnId: columnB, previousColumnId: null },
      { type: 'column-moved', columnId: columnA, previousColumnId: columnB },
      { type: 'column-renamed', column: { id: columnA, name: 'A2' } },
      { type: 'card-updated', card: { id: first, title: 'un bis' } },
      { type: 'card-deleted', cardId: first },
      { type: 'column-deleted', columnId: columnB },
      { type: 'board-renamed', name: 'Nouveau' },
      { type: 'board-deleted' },
    ]);
  });

  it('nomment la carte qui précède réellement', async () => {
    const column = await board.addColumn('A');
    const ids = [];
    for (const title of ['1', '2', '3']) ids.push(await board.addCard(column, title));
    const client = await follow(ada);
    const body = { columnId: column, previousCardId: ids[1], nextCardId: ids[2] };
    await send('PATCH', `/cards/${ids[0]}/position`, body);
    await vi.waitFor(() => expect(client.envelopes).toHaveLength(1));
    expect(client.envelopes[0]?.event).toMatchObject({ previousCardId: ids[1] });
  });

  it('ne partent pas et ne consomment pas de version si la modification échoue', async () => {
    const client = await follow(ada);
    expect((await send('DELETE', `/columns/${randomUUID()}`)).status).toBe(404);
    await board.addColumn('A');
    await vi.waitFor(() => expect(client.envelopes).toHaveLength(1));
    expect(client.envelopes[0]?.version).toBe(1);
  });

  it('restent dans leur board', async () => {
    const other = await BoardFixture.create(server, ada);
    const client = await follow(ada);
    await other.addColumn('Ailleurs');
    await settle();
    expect(client.envelopes).toEqual([]);
  });

  it('gardent des versions uniques sous des modifications simultanées', async () => {
    const client = await follow(ada);
    await Promise.all(['1', '2', '3', '4', '5', '6'].map((name) => board.addColumn(name)));
    await vi.waitFor(() => expect(client.envelopes).toHaveLength(6));
    const versions = client.envelopes.map(({ version }) => version);
    expect(versions.sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('membres', () => {
  it('une arrivée est annoncée', async () => {
    const client = await follow(ada);
    const response = await send('POST', '/invitations', { duration: 'one-day' });
    const { token } = (await response.json()) as { token: string };
    await server.send('POST', '/invitations/accept', { cookie: bob, body: { token } });
    await vi.waitFor(() =>
      expect(client.envelopes.map(({ event }) => event.type)).toEqual(['members-changed']),
    );
  });

  it.each(['retiré', 'parti'])('un membre %s ne reçoit plus rien et l’apprend', async (reason) => {
    await addMember(server, board.getId(), 'bob');
    const client = await follow(bob);
    if (reason === 'retiré') await send('DELETE', `/members/${await findUserId('bob')}`);
    else await send('DELETE', '/membership', undefined, bob);
    await vi.waitFor(() => expect(client.lostAccesses).toEqual([{ boardId: board.getId() }]));
    const received = client.envelopes.length;
    await board.addColumn('Secret');
    await settle();
    expect(client.envelopes).toHaveLength(received);
    expect(await client.join({ boardId: board.getId() })).toEqual({ status: 'refused' });
  });
});
