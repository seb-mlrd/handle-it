import { expect, it } from 'vitest';
import { formatRemainingTime } from './remaining-time';

const NOW = new Date('2026-01-01T00:00:00.000Z').getTime();

it.each([
  ['2026-01-08T00:00:00.000Z', '7 jours'],
  ['2026-01-07T23:59:00.000Z', '7 jours'],
  ['2026-01-08T00:00:20.000Z', '7 jours'],
  ['2026-01-02T00:00:00.000Z', '1 jour'],
  ['2026-01-01T23:10:00.000Z', '23 heures'],
  ['2026-01-01T01:00:20.000Z', '1 heure'],
  ['2026-01-01T01:00:00.000Z', '1 heure'],
  ['2026-01-01T00:59:10.000Z', '59 minutes'],
  ['2026-01-01T00:00:10.000Z', '1 minute'],
  ['2026-01-01T00:00:00.000Z', null],
])('jusqu’à %s : %s', (expiresAt, expected) => {
  // Intl sépare le nombre et l'unité par une espace insécable.
  const remainingTime = formatRemainingTime(expiresAt, NOW)?.replace(/\s/g, ' ') ?? null;
  expect(remainingTime).toBe(expected);
});
