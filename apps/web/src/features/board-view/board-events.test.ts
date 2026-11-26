import type { BoardEvent, BoardViewResponse } from '@handle-it/contracts';
import { describe, expect, it } from 'vitest';
import { applyBoardEvent, decideOnVersion } from './board-events';

const createColumn = (id: string, cardIds: string) => ({
  id,
  name: id,
  cards: [...cardIds].map((cardId) => ({
    id: cardId,
    title: cardId,
    dueOn: null,
    labelIds: [] as string[],
    commentCount: 0,
  })),
});
const BOARD: BoardViewResponse = {
  id: 'board',
  name: 'Maison',
  role: 'owner',
  version: 3,
  labels: [{ id: 'urgent', name: 'Urgent', color: 'red' }],
  columns: [createColumn('A', '123'), createColumn('B', '4'), createColumn('C', '')],
};
const read = ({ columns }: BoardViewResponse) =>
  columns.map(({ name, cards }) => name + cards.map(({ title }) => title).join('')).join(' ');

describe('applyBoardEvent', () => {
  it.each<[BoardEvent, string]>([
    [{ type: 'column-created', column: { id: 'D', name: 'D' } }, 'A123 B4 C D'],
    [{ type: 'column-renamed', column: { id: 'A', name: 'Z' } }, 'Z123 B4 C'],
    [{ type: 'column-deleted', columnId: 'A' }, 'B4 C'],
    [{ type: 'column-moved', columnId: 'C', previousColumnId: null }, 'C A123 B4'],
    [{ type: 'column-moved', columnId: 'A', previousColumnId: 'B' }, 'B4 A123 C'],
    [
      { type: 'card-created', columnId: 'C', card: { id: '5', title: '5', dueOn: null } },
      'A123 B4 C5',
    ],
    [{ type: 'card-updated', card: { id: '4', title: '9', dueOn: null } }, 'A123 B9 C'],
    [{ type: 'card-deleted', cardId: '2' }, 'A13 B4 C'],
    [{ type: 'card-moved', cardId: '1', columnId: 'A', previousCardId: '3' }, 'A231 B4 C'],
    [{ type: 'card-moved', cardId: '3', columnId: 'B', previousCardId: null }, 'A12 B34 C'],
    [{ type: 'card-moved', cardId: '1', columnId: 'B', previousCardId: '4' }, 'A23 B41 C'],
    [{ type: 'members-changed' }, 'A123 B4 C'],
    [{ type: 'card-deleted', cardId: 'inconnue' }, 'A123 B4 C'],
  ])('%j', (event, expected) => {
    const board = applyBoardEvent(BOARD, 4, event);
    expect(read(board)).toBe(expected);
    expect(board.version).toBe(4);
  });

  it('renomme le board', () => {
    expect(applyBoardEvent(BOARD, 4, { type: 'board-renamed', name: 'Bureau' }).name).toBe(
      'Bureau',
    );
  });
});

it.each([
  [2, 'ignore'],
  [3, 'ignore'],
  [4, 'apply'],
  [5, 'reload'],
])('à la version 3, l’événement %i : %s', (version, decision) => {
  expect(decideOnVersion(3, version)).toBe(decision);
});

describe('labels', () => {
  it('ajoute, renomme et supprime un label, et le retire des cartes', () => {
    const created = applyBoardEvent(BOARD, 4, {
      type: 'label-created',
      label: { id: 'calme', name: 'Calme', color: 'green' },
    });
    expect(created.labels.map(({ name }) => name)).toEqual(['Calme', 'Urgent']);
    const tagged = applyBoardEvent(created, 5, {
      type: 'card-labels-changed',
      cardId: '1',
      labelIds: ['urgent', 'calme'],
    });
    expect(tagged.columns[0]?.cards[0]?.labelIds).toEqual(['urgent', 'calme']);
    const updated = applyBoardEvent(tagged, 6, {
      type: 'card-updated',
      card: { id: '1', title: 'Pain', dueOn: '2026-12-01' },
    });
    expect(updated.columns[0]?.cards[0]).toEqual({
      id: '1',
      title: 'Pain',
      dueOn: '2026-12-01',
      labelIds: ['urgent', 'calme'],
      commentCount: 0,
    });
    const deleted = applyBoardEvent(updated, 7, { type: 'label-deleted', labelId: 'urgent' });
    expect(deleted.labels.map(({ id }) => id)).toEqual(['calme']);
    expect(deleted.columns[0]?.cards[0]?.labelIds).toEqual(['calme']);
  });

  it('crée une carte sans label ni commentaire', () => {
    const board = applyBoardEvent(BOARD, 4, {
      type: 'card-created',
      columnId: 'C',
      card: { id: '5', title: '5', dueOn: null },
    });
    expect(board.columns[2]?.cards[0]).toMatchObject({ labelIds: [], commentCount: 0 });
  });

  it('met à jour le nombre de commentaires de la seule carte concernée', () => {
    const board = applyBoardEvent(BOARD, 4, {
      type: 'card-comments-changed',
      cardId: '2',
      commentCount: 3,
    });
    expect(board.columns[0]?.cards.map(({ commentCount }) => commentCount)).toEqual([0, 3, 0]);
  });
});
