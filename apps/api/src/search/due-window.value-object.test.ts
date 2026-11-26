import { describe, expect, it } from 'vitest';
import { DueDate } from '../card/due-date.value-object.js';
import { DueWindow } from './due-window.value-object.js';

const read = (window: DueWindow) => ({
  isWithoutDate: window.isWithoutDate(),
  onOrAfter: window.getOnOrAfter()?.getValue() ?? null,
  before: window.getBefore()?.getValue() ?? null,
});

describe('DueWindow', () => {
  it('« en retard » s’arrête la veille', () => {
    expect(read(DueWindow.from('overdue', DueDate.fromValue('2026-11-26')))).toEqual({
      isWithoutDate: false,
      onOrAfter: null,
      before: '2026-11-26',
    });
  });

  it.each([
    ['2026-11-23', '2026-11-30'], // lundi
    ['2026-11-26', '2026-11-30'], // jeudi
    ['2026-11-29', '2026-11-30'], // dimanche : le seul jour restant
    ['2026-12-31', '2027-01-04'], // changement d'année
  ])('« cette semaine » va du %s à dimanche (avant le %s)', (today, before) => {
    expect(read(DueWindow.from('this-week', DueDate.fromValue(today)))).toEqual({
      isWithoutDate: false,
      onOrAfter: today,
      before,
    });
  });

  it('« sans date » ne retient que les cartes sans échéance', () => {
    expect(read(DueWindow.from('none', DueDate.fromValue('2026-11-26')))).toEqual({
      isWithoutDate: true,
      onOrAfter: null,
      before: null,
    });
  });
});
