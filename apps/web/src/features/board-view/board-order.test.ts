import { describe, expect, it } from 'vitest';
import {
  type Columns,
  describeCardMove,
  describeColumnMove,
  isSameOrder,
  moveCard,
  moveColumn,
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
