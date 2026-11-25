import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addMember, registerUser } from '../testing/accounts.js';
import { BoardFixture } from '../testing/board-fixture.js';
import { TestServer } from '../testing/test-server.js';

let server: TestServer;
let ada: string;
let bob: string;
let board: BoardFixture;
let columnA: string;
let columnB: string;
let cards: Record<string, string>;

const getCard = (title: string | null) => (title === null ? null : (cards[title] ?? title));

async function move(
  title: string,
  columnId: string,
  previous: string | null,
  next: string | null,
  cookie = ada,
): Promise<number> {
  const body = { columnId, previousCardId: getCard(previous), nextCardId: getCard(next) };
  const path = `${board.getPath()}/cards/${getCard(title)}/position`;
  return (await server.send('PATCH', path, { cookie, body })).status;
}

const readRanks = () =>
  server.getDatabase().card.findMany({ where: { columnId: columnA }, select: { rank: true } });

beforeEach(async () => {
  server = await TestServer.start();
  ada = await registerUser(server, 'ada');
  bob = await registerUser(server, 'bob');
  board = await BoardFixture.create(server, ada);
  columnA = await board.addColumn('A');
  columnB = await board.addColumn('B');
  cards = {};
  for (const title of ['1', '2', '3', '4']) cards[title] = await board.addCard(columnA, title);
});
afterEach(async () => {
  await server.stop();
});

describe('déplacement', () => {
  it('persiste dans la colonne et vers une autre', async () => {
    expect(await move('4', columnA, null, '1')).toBe(204);
    expect(await board.readOrder()).toEqual(['A: 4 1 2 3', 'B:']);
    expect(await move('1', columnB, null, null)).toBe(204);
    expect(await move('3', columnB, null, '1')).toBe(204);
    expect(await board.readOrder()).toEqual(['A: 4 2', 'B: 3 1']);
  });

  it('se repère sur un voisin resté en place si l’autre a été déplacé', async () => {
    await move('2', columnB, null, null);
    expect(await move('4', columnA, '1', '2')).toBe(204);
    expect(await board.readOrder()).toEqual(['A: 1 4 3', 'B: 2']);
  });

  it('rééquilibre des rangs devenus trop longs sans changer l’ordre', async () => {
    const { card } = server.getDatabase();
    const rank = `V00000${'0'.repeat(40)}1`;
    await card.update({ where: { id: cards['2'] ?? '' }, data: { rank } });
    expect(await move('4', columnA, '1', '2')).toBe(204);
    expect(await board.readOrder()).toEqual(['A: 1 4 2 3', 'B:']);
    expect((await readRanks()).every((record) => record.rank.length <= 32)).toBe(true);
  });
});

describe('déplacements simultanés', () => {
  it('vers le même endroit : aucun perdu, aucun doublon', async () => {
    const statuses = await Promise.all([
      move('2', columnB, null, null),
      move('3', columnB, null, null),
      move('4', columnB, null, null),
    ]);
    expect(statuses).toEqual([204, 204, 204]);
    const [first, second] = await board.readOrder();
    expect(first).toBe('A: 1');
    expect(second?.slice(3).split(' ').sort()).toEqual(['2', '3', '4']);
  });

  it('entre les mêmes voisins : les deux s’y trouvent', async () => {
    cards['5'] = await board.addCard(columnB, '5');
    cards['6'] = await board.addCard(columnB, '6');
    const statuses = await Promise.all([
      move('5', columnA, '1', '2'),
      move('6', columnA, '1', '2'),
    ]);
    expect(statuses).toEqual([204, 204]);
    expect(['A: 1 5 6 2 3 4', 'A: 1 6 5 2 3 4']).toContain((await board.readOrder())[0]);
  });

  it('de la même carte : elle finit à un seul endroit', async () => {
    const statuses = await Promise.all([
      move('1', columnB, null, null),
      move('1', columnA, '4', null),
    ]);
    expect(statuses).toEqual([204, 204]);
    expect([
      ['A: 2 3 4', 'B: 1'],
      ['A: 2 3 4 1', 'B:'],
    ]).toContainEqual(await board.readOrder());
  });

  it('pendant un rééquilibrage : toutes les cartes restent, sans doublon', async () => {
    const { card } = server.getDatabase();
    const rank = `V00000${'0'.repeat(40)}1`;
    await card.update({ where: { id: cards['2'] ?? '' }, data: { rank } });
    const statuses = await Promise.all([
      move('4', columnA, '1', '2'),
      move('3', columnA, '1', '2'),
    ]);
    expect(statuses).toEqual([204, 204]);
    expect((await board.readOrder())[0]?.slice(3).split(' ').sort()).toEqual(['1', '2', '3', '4']);
  });
});

describe('refus', () => {
  const ORDER = ['A: 1 2 3 4', 'B:'];

  it('d’un voisin, d’une carte ou d’une colonne d’un autre board', async () => {
    const other = await BoardFixture.create(server, ada);
    const otherColumn = await other.addColumn('X');
    cards['x'] = await other.addCard(otherColumn, 'x');
    const statuses = [
      await move('1', otherColumn, null, null),
      await move('1', columnB, 'x', null),
      await move('1', columnB, null, 'x'),
      await move('x', columnB, null, null),
      await move(randomUUID(), columnB, null, null),
    ];
    expect(statuses).toEqual([404, 404, 404, 404, 404]);
    expect(await board.readOrder()).toEqual(ORDER);
    expect(await other.readOrder()).toEqual(['X: x']);
  });

  it('d’une carte voisine d’elle-même ou d’une demande mal formée', async () => {
    expect(await move('1', columnA, '1', null)).toBe(400);
    expect(await move('1', 'mal-forme', null, null)).toBe(400);
  });

  it('à un non-membre, mais pas à un membre', async () => {
    expect(await move('1', columnB, null, null, bob)).toBe(404);
    expect(await board.readOrder()).toEqual(ORDER);
    await addMember(server, board.getId(), 'bob');
    expect(await move('1', columnB, null, null, bob)).toBe(204);
  });

  it('sans session', async () => {
    expect(await move('1', columnB, null, null, '')).toBe(401);
  });
});
