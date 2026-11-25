import { randomUUID } from 'node:crypto';
import type {
  BoardResponse,
  CreatedInvitationResponse,
  InvitationResponse,
  MemberResponse,
} from '@handle-it/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addMember, registerUser } from '../testing/accounts.js';
import { BoardFixture } from '../testing/board-fixture.js';
import { TestServer } from '../testing/test-server.js';

let server: TestServer;
let ada: string;
let bob: string;
let eve: string;
let board: BoardFixture;

const send = (method: string, path: string, cookie: string, body?: unknown) =>
  server.send(method, path, { cookie, body });

const sendToBoard = (method: string, path: string, cookie: string) =>
  send(method, `${board.getPath()}${path}`, cookie);

async function invite(): Promise<CreatedInvitationResponse> {
  const response = await send('POST', `${board.getPath()}/invitations`, ada, {
    duration: 'one-day',
  });
  return (await response.json()) as CreatedInvitationResponse;
}

const accept = (token: string, cookie: string) =>
  send('POST', '/invitations/accept', cookie, { token });

const preview = (token: string, cookie: string) =>
  send('POST', '/invitations/preview', cookie, { token });

async function listInvitations(): Promise<InvitationResponse[]> {
  return (await (await sendToBoard('GET', '/invitations', ada)).json()) as InvitationResponse[];
}

async function listMembers(): Promise<MemberResponse[]> {
  return (await (await sendToBoard('GET', '/members', ada)).json()) as MemberResponse[];
}

const readNames = async () => (await listMembers()).map(({ displayName }) => displayName);

beforeEach(async () => {
  server = await TestServer.start();
  ada = await registerUser(server, 'ada');
  bob = await registerUser(server, 'bob');
  eve = await registerUser(server, 'eve');
  board = await BoardFixture.create(server, ada);
});
afterEach(async () => {
  await server.stop();
});

describe('invitation', () => {
  it('ne stocke que l’empreinte du jeton, et ne le renvoie qu’à la création', async () => {
    const { id, token, expiresAt } = await invite();
    const record = await server.getDatabase().invitation.findFirstOrThrow();
    expect(record.tokenHash).toHaveLength(64);
    expect(record.tokenHash).not.toBe(token);
    expect(await listInvitations()).toEqual([{ id, expiresAt }]);
  });

  it('se consulte sans être consommée, puis fait entrer un membre', async () => {
    const { token } = await invite();
    const previewed = await preview(token, bob);
    expect(await previewed.json()).toEqual({ boardName: 'Test' });
    const accepted = await accept(token, bob);
    expect(accepted.status).toBe(200);
    expect((await accepted.json()) as BoardResponse).toEqual({
      id: board.getId(),
      name: 'Test',
      role: 'member',
    });
    expect(await listMembers()).toEqual([
      { userId: expect.any(String), displayName: 'ada', role: 'owner' },
      { userId: expect.any(String), displayName: 'bob', role: 'member' },
    ]);
  });

  it('ne sert qu’une fois', async () => {
    const { token } = await invite();
    await accept(token, bob);
    const response = await accept(token, eve);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ code: 'INVITATION_INVALID' });
    expect(await readNames()).toEqual(['ada', 'bob']);
  });

  it('ne sert qu’une fois, même pour deux invités simultanés', async () => {
    for (let round = 0; round < 5; round += 1) {
      const { token } = await invite();
      const responses = await Promise.all([accept(token, bob), accept(token, eve)]);
      expect(responses.map(({ status }) => status).sort()).toEqual([200, 404]);
      expect(await listMembers()).toHaveLength(2);
      await server.getDatabase().membership.deleteMany({ where: { role: 'member' } });
    }
  });

  it('acceptée deux fois en même temps par la même personne, l’ajoute une fois', async () => {
    const [first, second] = [await invite(), await invite()];
    const responses = await Promise.all([accept(first.token, bob), accept(second.token, bob)]);
    expect(responses.map(({ status }) => status)).toEqual([200, 200]);
    expect(await readNames()).toEqual(['ada', 'bob']);
  });

  it('n’est pas consommée par un membre, et ne change pas le rôle de l’owner', async () => {
    const { token } = await invite();
    expect(await (await accept(token, ada)).json()).toMatchObject({ role: 'owner' });
    expect((await accept(token, bob)).status).toBe(200);
  });

  it('est refusée une fois expirée, et purgée à la création suivante', async () => {
    const { token } = await invite();
    await server.getDatabase().invitation.updateMany({ data: { expiresAt: new Date(0) } });
    expect((await preview(token, bob)).status).toBe(404);
    expect((await accept(token, bob)).status).toBe(404);
    expect(await listInvitations()).toEqual([]);
    await invite();
    expect(await server.getDatabase().invitation.count()).toBe(1);
  });

  it('disparaît avec son board', async () => {
    const { token } = await invite();
    await send('DELETE', board.getPath(), ada);
    expect((await accept(token, bob)).status).toBe(404);
  });

  it.each([{}, { duration: 'toujours' }])('refuse une durée inconnue', async (body) => {
    const response = await send('POST', `${board.getPath()}/invitations`, ada, body);
    expect(response.status).toBe(400);
  });

  it.each(['', 'a'.repeat(101)])('refuse un jeton mal formé', async (token) => {
    expect((await accept(token, bob)).status).toBe(400);
  });
});

describe('membres', () => {
  const findId = async (name: string) =>
    (await listMembers()).find(({ displayName }) => displayName === name)?.userId ?? '';

  beforeEach(() => addMember(server, board.getId(), 'bob'));

  it('l’owner retire un membre, qui perd aussitôt l’accès', async () => {
    const path = `/members/${await findId('bob')}`;
    expect((await sendToBoard('DELETE', path, ada)).status).toBe(204);
    expect((await sendToBoard('GET', '', bob)).status).toBe(404);
    expect((await sendToBoard('DELETE', path, ada)).status).toBe(404);
  });

  it('retirer un membre annule les invitations de ce board seulement', async () => {
    const { token } = await invite();
    const other = await BoardFixture.create(server, ada);
    const body = { duration: 'one-day' };
    await send('POST', `${other.getPath()}/invitations`, ada, body);
    await sendToBoard('DELETE', `/members/${await findId('bob')}`, ada);
    expect((await accept(token, bob)).status).toBe(404);
    expect(await listInvitations()).toEqual([]);
    expect(await server.getDatabase().invitation.count()).toBe(1);
  });

  it('un retrait refusé ou un départ volontaire garde les invitations', async () => {
    await invite();
    await sendToBoard('DELETE', `/members/${await findId('ada')}`, ada);
    await sendToBoard('DELETE', '/membership', bob);
    expect(await listInvitations()).toHaveLength(1);
  });

  it('un membre quitte le board', async () => {
    expect((await sendToBoard('DELETE', '/membership', bob)).status).toBe(204);
    expect((await sendToBoard('GET', '', bob)).status).toBe(404);
    expect(await readNames()).toEqual(['ada']);
  });

  it('l’owner ne peut ni se retirer ni quitter son board', async () => {
    const path = `/members/${await findId('ada')}`;
    expect((await sendToBoard('DELETE', path, ada)).status).toBe(404);
    expect((await sendToBoard('DELETE', '/membership', ada)).status).toBe(403);
    expect(await readNames()).toEqual(['ada', 'bob']);
  });

  it('les adresses e-mail ne sont pas exposées', async () => {
    const response = await sendToBoard('GET', '/members', bob);
    expect(await response.text()).not.toContain('@');
  });
});

describe('table des droits', () => {
  const id = randomUUID();
  const body = { name: 'Nom' };
  const card = { title: 'Titre', description: '' };
  const cardMove = { columnId: id, previousCardId: null, nextCardId: null };
  const columnMove = { previousColumnId: null, nextColumnId: null };

  // 404 pour un membre : le droit est accordé, seul l'élément visé n'existe pas.
  it.each([
    ['GET', '', undefined, 200, 200],
    ['GET', '/columns', undefined, 200, 200],
    ['GET', '/members', undefined, 200, 200],
    ['GET', `/cards/${id}`, undefined, 404, 404],
    ['POST', '/columns', body, 201, 201],
    ['PATCH', `/columns/${id}`, body, 404, 404],
    ['PATCH', `/columns/${id}/position`, columnMove, 404, 404],
    ['DELETE', `/columns/${id}`, undefined, 404, 404],
    ['POST', `/columns/${id}/cards`, card, 404, 404],
    ['PATCH', `/cards/${id}`, card, 404, 404],
    ['PATCH', `/cards/${id}/position`, cardMove, 404, 404],
    ['DELETE', `/cards/${id}`, undefined, 404, 404],
    ['PATCH', '', body, 403, 200],
    ['POST', '/invitations', { duration: 'one-hour' }, 403, 201],
    ['GET', '/invitations', undefined, 403, 200],
    ['DELETE', `/members/${id}`, undefined, 403, 404],
    ['DELETE', '/membership', undefined, 204, 403],
    ['DELETE', '', undefined, 403, 204],
  ])('%s %s', async (method, path, requestBody, memberStatus, ownerStatus) => {
    await addMember(server, board.getId(), 'bob');
    const attempt = async (cookie: string) =>
      (await send(method, `${board.getPath()}${path}`, cookie, requestBody)).status;
    expect(await attempt('')).toBe(401);
    expect(await attempt(eve)).toBe(404);
    expect(await attempt(bob)).toBe(memberStatus);
    expect(await attempt(ada)).toBe(ownerStatus);
  });

  it.each(['preview', 'accept'])('POST /invitations/%s exige une session', async (action) => {
    const { token } = await invite();
    expect((await send('POST', `/invitations/${action}`, '', { token })).status).toBe(401);
  });
});
