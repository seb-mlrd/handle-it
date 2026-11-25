import { describe, expect, it } from 'vitest';
import { Rank } from './rank.value-object.js';

/** Suite pseudo-aléatoire reproductible : un échec peut être rejoué à l'identique. */
function createRandom(seed: number) {
  let state = seed;
  return (limit: number) => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return Math.floor((state / 2_147_483_648) * limit);
  };
}

describe('Rank', () => {
  it('place avant, après et entre', () => {
    const middle = Rank.between(null, null);
    const first = Rank.between(null, middle);
    const last = Rank.between(middle, null);
    const inserted = Rank.between(first, middle);
    const values = [first, inserted, middle, last].map((rank) => rank.getValue());
    expect([...values].sort()).toEqual(values);
    expect(new Set(values).size).toBe(4);
  });

  it('ne s’allonge pas quand on ajoute toujours à la fin', () => {
    let rank = Rank.between(null, null);
    for (let count = 0; count < 5000; count += 1) rank = Rank.between(rank, null);
    expect(rank.getValue()).toHaveLength(6);
  });

  it.each([1, 2, 3])('garde un ordre strict après 2000 insertions (graine %i)', (seed) => {
    const random = createRandom(seed);
    const ranks: Rank[] = [];
    for (let count = 0; count < 2000; count += 1) {
      const position = random(ranks.length + 1);
      const rank = Rank.between(ranks[position - 1] ?? null, ranks[position] ?? null);
      ranks.splice(position, 0, Rank.fromValue(rank.getValue()));
    }
    const values = ranks.map((rank) => rank.getValue());
    expect(values.every((value, index) => index === 0 || (values[index - 1] ?? '') < value)).toBe(
      true,
    );
  });

  it.each([
    ['juste après', true],
    ['juste avant', false],
  ])('supporte 200 insertions %s le même voisin', (_case, isAfter) => {
    const low = Rank.between(null, null);
    const high = Rank.between(low, null);
    let current = isAfter ? high : low;
    for (let count = 0; count < 200; count += 1) {
      const next = isAfter ? Rank.between(low, current) : Rank.between(current, high);
      expect(next.getValue() > low.getValue() && next.getValue() < high.getValue()).toBe(true);
      expect(
        isAfter ? next.getValue() < current.getValue() : next.getValue() > current.getValue(),
      ).toBe(true);
      current = next;
    }
  });

  it('refuse des voisins égaux ou inversés', () => {
    const low = Rank.between(null, null);
    const high = Rank.between(low, null);
    expect(() => Rank.between(high, low)).toThrow(RangeError);
    expect(() => Rank.between(low, low)).toThrow(RangeError);
  });

  it.each(['', 'V0000', 'V00000é', 'V000000'])('refuse la valeur « %s »', (value) => {
    expect(() => Rank.fromValue(value)).toThrow(RangeError);
  });

  it('refuse de dépasser les bornes', () => {
    expect(() => Rank.between(null, Rank.fromValue('000000'))).toThrow(RangeError);
    expect(() => Rank.between(Rank.fromValue('zzzzzz'), null)).toThrow(RangeError);
  });
});
