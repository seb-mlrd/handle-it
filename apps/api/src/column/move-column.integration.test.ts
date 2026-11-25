import { afterEach, beforeEach, expect, it } from 'vitest';
import { addMember, registerUser } from '../testing/accounts.js';
import { BoardFixture } from '../testing/board-fixture.js';
import { TestServer } from '../testing/test-server.js';

let server: TestServer;
let ada: string;
let bob: string;
let board: BoardFixture;
let columns: Record<string, string>;

const getColumn = (name: string | null) => (name === null ? null : (columns[name] ?? name));

async function move(
  name: string,
  previous: string | null,
  next: string | null,
  cookie = ada,
): Promise<number> {
  const body = { previousColumnId: getColumn(previous), nextColumnId: getColumn(next) };
  const path = `${board.getPath()}/columns/${getColumn(name)}/position`;
  return (await server.send('PATCH', path, { cookie, body })).status;
}

beforeEach(async () => {
  server = await TestServer.start();
  ada = await registerUser(server, 'ada');
  bob = await registerUser(server, 'bob');
  board = await BoardFixture.create(server, ada);
  columns = {};
  for (const name of ['A', 'B', 'C']) columns[name] = await board.addColumn(name);
});
afterEach(async () => {
  await server.stop();
});

it('persiste, avec les cartes de la colonne', async () => {
  await board.addCard(columns['C'] ?? '', '1');
  expect(await move('C', null, 'A')).toBe(204);
  expect(await board.readOrder()).toEqual(['C: 1', 'A:', 'B:']);
  expect(await move('C', 'A', 'B')).toBe(204);
  expect(await board.readOrder()).toEqual(['A:', 'C: 1', 'B:']);
});

it('reste cohérent pour deux déplacements simultanés au même endroit', async () => {
  const statuses = await Promise.all([move('B', null, 'A'), move('C', null, 'A')]);
  expect(statuses).toEqual([204, 204]);
  expect([
    ['B:', 'C:', 'A:'],
    ['C:', 'B:', 'A:'],
  ]).toContainEqual(await board.readOrder());
});

it('rééquilibre des rangs devenus trop longs sans changer l’ordre', async () => {
  const { column } = server.getDatabase();
  const rank = `V00000${'0'.repeat(40)}1`;
  await column.update({ where: { id: columns['B'] ?? '' }, data: { rank } });
  expect(await move('C', 'A', 'B')).toBe(204);
  expect(await board.readOrder()).toEqual(['A:', 'C:', 'B:']);
  const ranks = await column.findMany({ select: { rank: true } });
  expect(ranks.every((record) => record.rank.length <= 32)).toBe(true);
});

it('refuse une colonne d’un autre board ou voisine d’elle-même', async () => {
  const other = await BoardFixture.create(server, ada);
  columns['X'] = await other.addColumn('X');
  expect([await move('X', null, 'A'), await move('A', 'X', null)]).toEqual([404, 404]);
  expect(await move('A', 'A', null)).toBe(400);
  expect(await board.readOrder()).toEqual(['A:', 'B:', 'C:']);
});

it('est réservé aux membres', async () => {
  expect(await move('C', null, 'A', '')).toBe(401);
  expect(await move('C', null, 'A', bob)).toBe(404);
  await addMember(server, board.getId(), 'bob');
  expect(await move('C', null, 'A', bob)).toBe(204);
});
