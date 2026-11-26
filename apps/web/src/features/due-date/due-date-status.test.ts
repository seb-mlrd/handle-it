import { describe, expect, it } from 'vitest';
import { describeDueDate, formatDueDate, getDueStatus, toLocalDate } from './due-date-status';

const TODAY = '2026-11-26';
const read = (text: string) => text.replace(/\s/g, ' ');

describe('échéance', () => {
  it.each([
    ['2026-11-20', 'overdue', 'En retard · 20 nov.'],
    ['2026-11-25', 'overdue', 'En retard · 25 nov.'],
    ['2026-11-26', 'today', "Aujourd'hui"],
    ['2026-11-27', 'tomorrow', 'Demain'],
    ['2026-12-03', 'later', 'Échéance 3 déc.'],
  ])('%s : %s', (dueOn, status, text) => {
    expect(getDueStatus(dueOn, TODAY)).toBe(status);
    expect(read(describeDueDate(dueOn, TODAY))).toBe(text);
  });

  it('compte les jours sans être piégé par le changement d’heure', () => {
    expect(getDueStatus('2026-03-30', '2026-03-29')).toBe('tomorrow');
    expect(getDueStatus('2026-10-26', '2026-10-25')).toBe('tomorrow');
  });

  it('écrit la date en toutes lettres, sans décalage de fuseau', () => {
    expect(read(formatDueDate('2026-12-31'))).toBe('31 décembre 2026');
  });

  it('donne le jour local', () => {
    expect(toLocalDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
