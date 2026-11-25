import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BoardResponse } from '@handle-it/contracts';
import { TestServer } from '../testing/test-server.js';

let server: TestServer;
let ada: string;
let bob: string;

async function register(name: string): Promise<string> {
  const body = { email: `${name}@example.com`, displayName: name, password: 'mot-de-passe-long' };
  const response = await server.send('POST', '/auth/register', { body });
  return response.headers.get('set-cookie')?.split(';')[0] ?? '';
}

const create = (cookie: string, name = 'Maison') =>
  server.send('POST', '/boards', { cookie, body: { name } });

const readBoard = async (response: Response) => (await response.json()) as BoardResponse;

async function list(cookie: string) {
  const response = await server.send('GET', '/boards', { cookie });
  return (await response.json()) as BoardResponse[];
}

async function addBobAsMember(boardId: string) {
  const database = server.getDatabase();
  const { id: userId } = await database.user.findUniqueOrThrow({
    where: { email: 'bob@example.com' },
  });
  await database.membership.create({ data: { boardId, userId, role: 'member' } });
}

beforeEach(async () => {
  server = await TestServer.start();
  ada = await register('ada');
  bob = await register('bob');
});
afterEach(async () => {
  await server.stop();
});

describe('création et liste', () => {
  it("crée un board dont l'utilisateur est owner", async () => {
    const response = await create(ada);
    expect(response.status).toBe(201);
    const board = await readBoard(response);
    expect(board).toEqual({ id: expect.any(String), name: 'Maison', role: 'owner' });
    expect(await list(ada)).toEqual([board]);
  });

  it('ne laisse aucun board orphelin si son owner ne peut pas être enregistré', async () => {
    const cookie = ada;
    const database = server.getDatabase();
    await database.$executeRaw`ALTER TABLE memberships ADD CONSTRAINT test_refus CHECK (role <> 'owner') NOT VALID`;
    try {
      expect((await create(cookie)).status).toBe(500);
      expect(await database.board.count()).toBe(0);
    } finally {
      await database.$executeRaw`ALTER TABLE memberships DROP CONSTRAINT test_refus`;
    }
  });

  it('liste du plus récent au plus ancien, sans les boards des autres', async () => {
    await create(ada, 'Premier');
    await create(ada, 'Second');
    await create(bob, 'Secret');
    expect((await list(ada)).map(({ name }) => name)).toEqual(['Second', 'Premier']);
  });

  it('montre à un membre les boards partagés, avec son rôle', async () => {
    const board = await readBoard(await create(ada));
    await addBobAsMember(board.id);
    expect(await list(bob)).toEqual([{ ...board, role: 'member' }]);
  });

  it('refuse un nom vide', async () => {
    const response = await create(ada, '  ');
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ fieldErrors: { name: expect.any(Array) } });
  });
});

describe('renommage et suppression', () => {
  let path: string;
  let board: BoardResponse;
  const body = { name: 'Travail' };

  beforeEach(async () => {
    board = await readBoard(await create(ada));
    path = `/boards/${board.id}`;
  });

  it("sont permis à l'owner", async () => {
    const renamed = await server.send('PATCH', path, { cookie: ada, body });
    expect(renamed.status).toBe(200);
    expect(await renamed.json()).toEqual({ ...board, name: 'Travail' });
    expect((await server.send('DELETE', path, { cookie: ada })).status).toBe(204);
    expect(await list(ada)).toEqual([]);
    expect(await server.getDatabase().membership.count()).toBe(0);
  });

  it('sont interdits à un membre', async () => {
    await addBobAsMember(board.id);
    expect((await server.send('PATCH', path, { cookie: bob, body })).status).toBe(403);
    expect((await server.send('DELETE', path, { cookie: bob })).status).toBe(403);
    expect(await list(ada)).toEqual([board]);
  });

  it('répondent à un non-membre comme si le board n’existait pas', async () => {
    const unknownPath = `/boards/${randomUUID()}`;
    for (const target of [path, unknownPath]) {
      const renamed = await server.send('PATCH', target, { cookie: bob, body });
      const deleted = await server.send('DELETE', target, { cookie: bob });
      expect([renamed.status, deleted.status]).toEqual([404, 404]);
      expect(await renamed.json()).toEqual({ code: 'NOT_FOUND' });
    }
    expect(await list(ada)).toEqual([board]);
  });

  it('refusent un identifiant mal formé', async () => {
    expect((await server.send('DELETE', '/boards/abc', { cookie: ada })).status).toBe(400);
  });
});

it.each([
  ['GET', '/boards'],
  ['POST', '/boards'],
  ['PATCH', `/boards/${randomUUID()}`],
  ['DELETE', `/boards/${randomUUID()}`],
])('%s %s exige une session', async (method, path) => {
  expect((await server.send(method, path)).status).toBe(401);
});
