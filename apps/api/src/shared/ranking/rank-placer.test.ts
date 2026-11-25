import { beforeEach, describe, expect, it } from 'vitest';
import { createFreshRanks } from './create-fresh-ranks.js';
import { getNeighbourIds } from './get-neighbour-ids.js';
import { InvalidPlacementError } from './invalid-placement.error.js';
import { RankPlacer } from './rank-placer.js';
import { Rank } from './rank.value-object.js';
import { RankedList } from './ranked-list.js';

class InMemoryList extends RankedList {
  private readonly ranks = new Map<string, Rank>();
  rebalanceCount = 0;

  set(id: string, rank: Rank): void {
    this.ranks.set(id, rank);
  }

  getOrder(): string[] {
    return this.sort().map(([id]) => id);
  }

  override async findRank(id: string) {
    return this.ranks.get(id) ?? null;
  }

  override async findNextRank(rank: Rank, movedId: string) {
    const found = this.sort(movedId).find(([, other]) => other.getValue() > rank.getValue());
    return found?.[1] ?? null;
  }

  override async findPreviousRank(rank: Rank, movedId: string) {
    const found = this.sort(movedId).findLast(([, other]) => other.getValue() < rank.getValue());
    return found?.[1] ?? null;
  }

  override async findLastRank(movedId: string) {
    return this.sort(movedId).at(-1)?.[1] ?? null;
  }

  override async rebalance() {
    this.rebalanceCount += 1;
    const items = this.sort();
    const fresh = createFreshRanks(items.length, items.at(-1)?.[1] ?? null);
    items.forEach(([id], index) => fresh[index] && this.ranks.set(id, fresh[index]));
  }

  private sort(exceptId?: string) {
    return [...this.ranks]
      .filter(([id]) => id !== exceptId)
      .sort(([, a], [, b]) => (a.getValue() < b.getValue() ? -1 : 1));
  }
}

let list: InMemoryList;

async function move(itemId: string, previousItemId: string | null, nextItemId: string | null) {
  list.set(itemId, await new RankPlacer().place(list, { itemId, previousItemId, nextItemId }));
  return list.getOrder().join('');
}

beforeEach(() => {
  list = new InMemoryList();
  createFreshRanks(4, null).forEach((rank, index) => list.set('abcd'.charAt(index), rank));
});

describe('RankPlacer', () => {
  it.each([
    ['au début', 'c', null, 'a', 'cabd'],
    ['à la fin', 'a', 'd', null, 'bcda'],
    ['entre deux voisins', 'd', 'a', 'b', 'adbc'],
    ['à sa propre place', 'b', 'a', 'c', 'abcd'],
    ['à la fin sans aucun repère', 'a', null, null, 'bcda'],
    ['après le précédent même si le suivant est parti', 'd', 'a', 'parti', 'adbc'],
    ['avant le suivant si le précédent est parti', 'd', 'parti', 'b', 'adbc'],
    ['à la fin si les deux sont partis', 'a', 'parti', 'disparu', 'bcda'],
    ['après le précédent si les voisins se sont éloignés', 'd', 'a', 'c', 'adbc'],
  ])('place %s', async (_case, item, previous, next, expected) => {
    expect(await move(item, previous, next)).toBe(expected);
  });

  it('rééquilibre une fois les rangs trop longs, sans changer l’ordre', async () => {
    list.set('b', Rank.fromValue(`V00000${'0'.repeat(40)}1`));
    expect(await move('d', 'a', 'b')).toBe('adbc');
    expect(list.rebalanceCount).toBe(1);
    expect((await list.findRank('d'))?.getValue().length).toBeLessThanOrEqual(32);
  });

  it('garde des rangs courts après mille insertions au même endroit', async () => {
    for (let count = 0; count < 500; count += 1) {
      await move('c', 'a', 'b');
      await move('b', 'a', 'c');
    }
    expect(list.getOrder().join('')).toBe('abcd');
    expect(list.rebalanceCount).toBeGreaterThan(0);
  });
});

describe('getNeighbourIds', () => {
  it('ignore les bouts de liste et les doublons', () => {
    const placement = { itemId: 'a', previousItemId: 'b', nextItemId: 'b' };
    expect(getNeighbourIds(placement)).toEqual(['b']);
    expect(getNeighbourIds({ ...placement, previousItemId: null, nextItemId: null })).toEqual([]);
  });

  it.each([
    ['a', null],
    [null, 'a'],
  ])('refuse un élément voisin de lui-même', (previousItemId, nextItemId) => {
    expect(() => getNeighbourIds({ itemId: 'a', previousItemId, nextItemId })).toThrow(
      InvalidPlacementError,
    );
  });
});
