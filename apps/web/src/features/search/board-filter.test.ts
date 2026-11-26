import { describe, expect, it } from 'vitest';
import {
  type Columns,
  describeCardMove,
  moveCard,
  replayCardMove,
} from '../board-view/board-order';
import { EMPTY_BOARD_FILTER, filterColumns, getEndOfWeek, matchesDue } from './board-filter';

const TODAY = '2026-11-26';
const card = (id: string, labelIds: string[] = [], dueOn: string | null = null) => ({
  id,
  title: id,
  dueOn,
  labelIds,
  commentCount: 0,
});
const COLUMNS: Columns = [
  {
    id: 'A',
    name: 'A',
    cards: [card('1', ['urgent']), card('2'), card('3', ['urgent'], '2026-11-20'), card('4')],
  },
  { id: 'B', name: 'B', cards: [card('5', [], '2026-11-29')] },
];
const read = (columns: Columns) =>
  columns.map(({ id, cards }) => id + cards.map((item) => item.id).join('')).join(' ');
const NO_TEXT = { matchingCardIds: null, today: TODAY };

describe('filterColumns', () => {
  it('laisse le board tel quel sans critère', () => {
    expect(filterColumns(COLUMNS, EMPTY_BOARD_FILTER, NO_TEXT)).toBe(COLUMNS);
  });

  it('combine texte, labels et échéance, sans masquer de colonne', () => {
    const urgent = { ...EMPTY_BOARD_FILTER, labelIds: ['urgent'] };
    expect(read(filterColumns(COLUMNS, urgent, NO_TEXT))).toBe('A13 B');
    const text = { matchingCardIds: new Set(['1', '2', '5']), today: TODAY };
    expect(read(filterColumns(COLUMNS, urgent, text))).toBe('A1 B');
    const thisWeek = { ...EMPTY_BOARD_FILTER, due: 'this-week' as const };
    expect(read(filterColumns(COLUMNS, thisWeek, NO_TEXT))).toBe('A B5');
  });

  it('rejoue sur le board complet un déplacement fait sur la vue filtrée', () => {
    // Vue « urgent » : A13. La carte 3 passe avant la 1 : elle se range juste avant elle.
    const visible = filterColumns(
      COLUMNS,
      { ...EMPTY_BOARD_FILTER, labelIds: ['urgent'] },
      NO_TEXT,
    );
    const request = describeCardMove(moveCard(visible, '3', 'A', 0), '3');
    expect(request).toEqual({ columnId: 'A', previousCardId: null, nextCardId: '1' });
    expect(request && read(replayCardMove(COLUMNS, '3', request) ?? [])).toBe('A3124 B5');
  });
});

describe('matchesDue', () => {
  it.each([
    ['2026-11-23', '2026-11-29'],
    ['2026-11-29', '2026-11-29'],
    ['2026-12-31', '2027-01-03'],
  ])('la semaine du %s finit le %s', (today, sunday) => {
    expect(getEndOfWeek(today)).toBe(sunday);
  });

  it.each([
    [null, 'none', true],
    ['2026-11-25', 'overdue', true],
    ['2026-11-26', 'overdue', false],
    ['2026-11-26', 'this-week', true],
    ['2026-11-29', 'this-week', true],
    ['2026-11-30', 'this-week', false],
    ['2026-11-25', 'this-week', false],
  ] as const)('échéance %s, filtre %s : %s', (dueOn, due, expected) => {
    expect(matchesDue(dueOn, due, TODAY)).toBe(expected);
  });
});
