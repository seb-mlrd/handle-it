import { randomUUID } from 'node:crypto';
import type {
  ActivityPageResponse,
  BoardViewResponse,
  CommentPageResponse,
  CommentResponse,
} from '@handle-it/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addMember, registerUser } from '../testing/accounts.js';
import { BoardFixture } from '../testing/board-fixture.js';
import { RealtimeClient } from '../testing/realtime-client.js';
import { TestServer } from '../testing/test-server.js';

let server: TestServer;
let ada: string;
let bob: string;
let board: BoardFixture;
let card: string;

const send = (method: string, path: string, body?: unknown, cookie = ada) =>
  server.send(method, `${board.getPath()}${path}`, { cookie, body });

async function addComment(body: string, cookie = ada): Promise<CommentResponse> {
  const response = await send('POST', `/cards/${card}/comments`, { body }, cookie);
  return (await response.json()) as CommentResponse;
}

async function readThread(query = '', cookie = ada): Promise<CommentPageResponse> {
  const response = await send('GET', `/cards/${card}/comments${query}`, undefined, cookie);
  return (await response.json()) as CommentPageResponse;
}

const readBodies = async (cookie = ada) =>
  (await readThread('', cookie)).items.map(({ authorName, body }) => `${authorName}: ${body}`);

const userId = async (name: string) =>
  (await server.getDatabase().user.findUniqueOrThrow({ where: { email: `${name}@example.com` } }))
    .id;

beforeEach(async () => {
  server = await TestServer.start();
  ada = await registerUser(server, 'ada');
  bob = await registerUser(server, 'bob');
  board = await BoardFixture.create(server, ada);
  card = await board.addCard(await board.addColumn('A'), 'Pain');
  await addMember(server, board.getId(), 'bob');
});
afterEach(async () => {
  await server.stop();
});

describe('fil de commentaires', () => {
  it('se lit du plus ancien au plus récent, avec les droits de qui lit', async () => {
    const first = await addComment('  Qui s’en occupe ?\n');
    expect(first).toMatchObject({
      authorName: 'ada',
      body: 'Qui s’en occupe ?',
      updatedAt: null,
      canEdit: true,
      canDelete: true,
    });
    await addComment('Moi', bob);
    expect(await readBodies()).toEqual(['ada: Qui s’en occupe ?', 'bob: Moi']);
    const seenByBob = (await readThread('', bob)).items.map(({ canEdit, canDelete }) => ({
      canEdit,
      canDelete,
    }));
    expect(seenByBob).toEqual([
      { canEdit: false, canDelete: false },
      { canEdit: true, canDelete: true },
    ]);
    const seenByAda = (await readThread()).items[1];
    expect(seenByAda).toMatchObject({ canEdit: false, canDelete: true });
  });

  it('refuse un texte vide ou trop long', async () => {
    expect((await send('POST', `/cards/${card}/comments`, { body: ' \n ' })).status).toBe(400);
    const tooLong = { body: 'a'.repeat(2001) };
    expect((await send('POST', `/cards/${card}/comments`, tooLong)).status).toBe(400);
    expect(await readBodies()).toEqual([]);
  });

  it('se lit page par page sans doublon ni oubli', async () => {
    for (let index = 0; index < 35; index += 1) await addComment(`Message ${index}`);
    const first = await readThread();
    expect(first.items).toHaveLength(30);
    expect(first.items[0]?.body).toBe('Message 0');
    const second = await readThread(`?after=${first.nextCursor}`);
    expect(second.items.map(({ body }) => body)).toEqual([
      'Message 30',
      'Message 31',
      'Message 32',
      'Message 33',
      'Message 34',
    ]);
    expect(second.nextCursor).toBeNull();
    expect((await readThread('?after=abc')).items).toBeUndefined();
  });

  it('compte les commentaires de chaque carte dans la vue du board', async () => {
    await addComment('Un');
    await addComment('Deux', bob);
    const view = (await (await send('GET', '')).json()) as BoardViewResponse;
    expect(view.columns[0]?.cards[0]?.commentCount).toBe(2);
  });

  it('disparaît avec sa carte', async () => {
    await addComment('Un');
    await send('DELETE', `/cards/${card}`);
    expect(await server.getDatabase().comment.count()).toBe(0);
  });
});

describe('modification et suppression', () => {
  it('l’auteur modifie son commentaire, marqué modifié', async () => {
    const { id } = await addComment('Brouillon', bob);
    const response = await send('PATCH', `/comments/${id}`, { body: 'Version finale' }, bob);
    const edited = (await response.json()) as CommentResponse;
    expect(edited.body).toBe('Version finale');
    expect(edited.updatedAt).not.toBeNull();
    expect((await readThread()).items[0]?.updatedAt).toBe(edited.updatedAt);
  });

  it('personne d’autre ne modifie un commentaire, pas même l’owner', async () => {
    const { id } = await addComment('De Bob', bob);
    const response = await send('PATCH', `/comments/${id}`, { body: 'Pirate' });
    expect(response.status).toBe(403);
    expect(await readBodies()).toEqual(['bob: De Bob']);
  });

  it('l’auteur et l’owner suppriment, un autre membre non', async () => {
    const fromAda = await addComment('De Ada');
    const fromBob = await addComment('De Bob', bob);
    const another = await addComment('Encore Bob', bob);
    expect((await send('DELETE', `/comments/${fromAda.id}`, undefined, bob)).status).toBe(403);
    expect((await send('DELETE', `/comments/${another.id}`, undefined, bob)).status).toBe(204);
    expect((await send('DELETE', `/comments/${fromBob.id}`)).status).toBe(204);
    expect(await readBodies()).toEqual(['ada: De Ada']);
    expect((await send('DELETE', `/comments/${fromBob.id}`)).status).toBe(404);
  });

  it('refuse un commentaire ou une carte d’un autre board', async () => {
    const other = await BoardFixture.create(server, ada);
    const foreignCard = await other.addCard(await other.addColumn('X'), 'Ailleurs');
    const foreign = (await (
      await server.send('POST', `${other.getPath()}/cards/${foreignCard}/comments`, {
        cookie: ada,
        body: { body: 'Ailleurs' },
      })
    ).json()) as CommentResponse;
    expect((await send('PATCH', `/comments/${foreign.id}`, { body: 'Ici' })).status).toBe(404);
    expect((await send('DELETE', `/comments/${foreign.id}`)).status).toBe(404);
    expect((await send('POST', `/cards/${foreignCard}/comments`, { body: 'Ici' })).status).toBe(
      404,
    );
    expect((await send('GET', `/cards/${foreignCard}/comments`)).status).toBe(404);
  });
});

describe('auteur parti', () => {
  it('signe « Ancien membre » un membre retiré, qui ne peut plus rien en faire', async () => {
    const { id } = await addComment('Je reste', bob);
    await send('DELETE', `/members/${await userId('bob')}`);
    const [comment] = (await readThread()).items;
    expect(comment).toMatchObject({ authorName: null, body: 'Je reste', canDelete: true });
    expect((await send('DELETE', `/comments/${id}`, undefined, bob)).status).toBe(404);
  });

  it('garde le commentaire d’un compte supprimé', async () => {
    await addComment('Adieu', bob);
    await server.getDatabase().user.delete({ where: { id: await userId('bob') } });
    expect(await readBodies()).toEqual(['null: Adieu']);
  });
});

describe('temps réel et historique', () => {
  it('annonce le nombre de commentaires et inscrit l’historique, sans le texte', async () => {
    const client = await RealtimeClient.connect(server, bob);
    await client.join({ boardId: board.getId() });
    const { id } = await addComment('secret');
    await send('PATCH', `/comments/${id}`, { body: 'toujours secret' });
    await send('DELETE', `/comments/${id}`);
    await vi.waitFor(() => expect(client.envelopes).toHaveLength(3));
    expect(client.envelopes.map(({ event }) => event)).toEqual([
      { type: 'card-comments-changed', cardId: card, commentCount: 1 },
      { type: 'card-comments-changed', cardId: card, commentCount: 1 },
      { type: 'card-comments-changed', cardId: card, commentCount: 0 },
    ]);
    client.close();
    const history = (await (await send('GET', '/activities')).json()) as ActivityPageResponse;
    expect(
      history.items
        .slice(0, 3)
        .map(({ details }) => details)
        .reverse(),
    ).toEqual([
      { type: 'comment-added', cardTitle: 'Pain' },
      { type: 'comment-updated', cardTitle: 'Pain' },
      { type: 'comment-deleted', cardTitle: 'Pain' },
    ]);
    expect(JSON.stringify(history)).not.toContain('secret');
  });

  it('n’écrit rien pour une action refusée', async () => {
    const { id } = await addComment('De Ada');
    await send('PATCH', `/comments/${id}`, { body: 'Pirate' }, bob);
    await send('DELETE', `/comments/${randomUUID()}`);
    const history = (await (await send('GET', '/activities')).json()) as ActivityPageResponse;
    expect(history.items[0]?.details.type).toBe('comment-added');
  });
});

describe('droits', () => {
  it('un non-membre ne lit ni n’écrit rien', async () => {
    const eve = await registerUser(server, 'eve');
    const { id } = await addComment('Privé');
    const attempts = (cookie: string) =>
      Promise.all([
        send('GET', `/cards/${card}/comments`, undefined, cookie),
        send('POST', `/cards/${card}/comments`, { body: 'Intrus' }, cookie),
        send('PATCH', `/comments/${id}`, { body: 'Intrus' }, cookie),
        send('DELETE', `/comments/${id}`, undefined, cookie),
      ]).then((responses) => responses.map(({ status }) => status));
    expect(await attempts(eve)).toEqual([404, 404, 404, 404]);
    expect(await attempts('')).toEqual([401, 401, 401, 401]);
    expect(await readBodies()).toEqual(['ada: Privé']);
  });
});
