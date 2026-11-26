import { describe, expect, it } from 'vitest';
import {
  type Columns,
  describeCardMove,
  describeColumnMove,
  isSameOrder,
  moveCard,
  moveColumn,
  replayCardMove,
  replayColumnMove,
} from './board-order';

const createColumn = (id: string, cardIds: string) => ({
  id,
  name: id,
  cards: [...cardIds].map((cardId) => ({ id: cardId, title: cardId })),
});
const COLUMNS = [createColumn('A', '123'), createColumn('B', '4'), createColumn('C', '')];
const read = (columns: Columns) =>
  columns.map(({ id, cards }) => id + cards.map((card) => card.id).join('')).join(' ');

describe('moveCard', () => {
  it.each([
    ['1', 'A', 2, 'A231 B4 C'],
    ['3', 'A', 0, 'A312 B4 C'],
    ['2', 'A', 1, 'A123 B4 C'],
    ['1', 'B', 0, 'A23 B14 C'],
    ['1', 'B', 1, 'A23 B41 C'],
    ['4', 'C', 0, 'A123 B C4'],
    ['inconnue', 'C', 0, 'A123 B4 C'],
    ['1', 'inconnue', 0, 'A123 B4 C'],
  ])('place %s dans %s à %i', (cardId, columnId, index, expected) => {
    expect(read(moveCard(COLUMNS, cardId, columnId, index))).toBe(expected);
  });
});

describe('moveColumn', () => {
  it.each([
    ['C', 0, 'C A123 B4'],
    ['A', 2, 'B4 C A123'],
    ['inconnue', 0, 'A123 B4 C'],
  ])('place %s à %i', (columnId, index, expected) => {
    expect(read(moveColumn(COLUMNS, columnId, index))).toBe(expected);
  });
});

describe('description pour l’API', () => {
  it('nomme les voisines d’une carte', () => {
    const request = { columnId: 'A', previousCardId: '1', nextCardId: '3' };
    expect(describeCardMove(COLUMNS, '2')).toEqual(request);
    const alone = { columnId: 'B', previousCardId: null, nextCardId: null };
    expect(describeCardMove(COLUMNS, '4')).toEqual(alone);
    expect(describeCardMove(COLUMNS, 'inconnue')).toBeNull();
  });

  it('nomme les voisines d’une colonne', () => {
    const request = { previousColumnId: null, nextColumnId: 'B' };
    expect(describeColumnMove(COLUMNS, 'A')).toEqual(request);
  });
});

it('isSameOrder ignore tout sauf l’ordre', () => {
  const renamed = COLUMNS.map((column) => ({ ...column, name: 'autre' }));
  expect(isSameOrder(COLUMNS, renamed)).toBe(true);
  expect(isSameOrder(COLUMNS, moveCard(COLUMNS, '1', 'C', 0))).toBe(false);
});

describe('rejouer après un changement', () => {
  const replay = (previousCardId: string | null, nextCardId: string | null, columnId = 'A') => {
    const columns = replayCardMove(COLUMNS, '4', { columnId, previousCardId, nextCardId });
    return columns && read(columns);
  };

  it.each([
    ['1', '2', 'A1423 B C'],
    ['disparue', '2', 'A1423 B C'],
    ['1', 'disparue', 'A1423 B C'],
    ['disparue', 'perdue', 'A1234 B C'],
    [null, '1', 'A4123 B C'],
  ])('place la carte entre %s et %s', (previousId, nextId, expected) => {
    expect(replay(previousId, nextId)).toBe(expected);
  });

  it('abandonne si la carte ou la colonne a disparu', () => {
    expect(replay(null, null, 'disparue')).toBeNull();
    const request = { columnId: 'A', previousCardId: null, nextCardId: null };
    expect(replayCardMove(COLUMNS, 'disparue', request)).toBeNull();
    const columnRequest = { previousColumnId: null, nextColumnId: null };
    expect(replayColumnMove(COLUMNS, 'disparue', columnRequest)).toBeNull();
  });

  it('place une colonne', () => {
    const request = { previousColumnId: 'disparue', nextColumnId: 'A' };
    expect(read(replayColumnMove(COLUMNS, 'C', request) ?? [])).toBe('C A123 B4');
  });
});
