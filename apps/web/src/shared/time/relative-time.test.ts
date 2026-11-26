import { expect, it } from 'vitest';
import { formatRelativeTime } from './relative-time';

const NOW = new Date('2026-11-26T12:00:00.000Z').getTime();

it.each([
  ['2026-11-26T11:59:30.000Z', "à l'instant"],
  ['2026-11-26T11:55:00.000Z', 'il y a 5 minutes'],
  ['2026-11-26T09:00:00.000Z', 'il y a 3 heures'],
  ['2026-11-25T10:00:00.000Z', 'hier'],
  ['2026-11-22T12:00:00.000Z', 'il y a 4 jours'],
])('%s : %s', (date, expected) => {
  expect(formatRelativeTime(date, NOW).replace(/\s/g, ' ')).toBe(expected);
});

it('donne la date au-delà d’une semaine', () => {
  expect(formatRelativeTime('2026-11-01T12:00:00.000Z', NOW)).toMatch(/^le 1 novembre 2026/);
});
