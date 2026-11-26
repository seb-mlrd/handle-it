import { randomUUID } from 'node:crypto';
import type { SearchResponse } from '@handle-it/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerUser } from '../testing/accounts.js';
import { BoardFixture } from '../testing/board-fixture.js';
import { TestServer } from '../testing/test-server.js';

const CARD_COUNT = 10_000;
const COLUMN_COUNT = 10;
const MAX_RESPONSE_MILLISECONDS = 200;
const MEASURES = 7;
/** Par lots : une seule insertion dépasserait le délai maximal d'une requête. */
const INSERT_BATCH_SIZE = 1000;
const WORDS = ['pain', 'lait', 'beurre', 'facture', 'réunion', 'dentiste', 'vélo', 'jardin'];

let server: TestServer;
let ada: string;

/** Titres et descriptions variés, dont des « Pâtes » rares et des mots très fréquents. */
function createCard(columnId: string, index: number) {
  const word = WORDS[index % WORDS.length] ?? 'pain';
  const title = index % 100 === 0 ? `Pâtes fraîches ${index}` : `${word} numéro ${index}`;
  return {
    id: randomUUID(),
    columnId,
    title,
    description: `Penser au ${WORDS[(index * 7) % WORDS.length]} avant la fin de la semaine.`,
    rank: String(index).padStart(6, '0'),
  };
}

async function measure(path: string): Promise<number> {
  const durations: number[] = [];
  for (let attempt = 0; attempt < MEASURES; attempt += 1) {
    const start = performance.now();
    const response = await server.send('GET', path, { cookie: ada });
    durations.push(performance.now() - start);
    expect(((await response.json()) as SearchResponse).results.length).toBeGreaterThan(0);
  }
  // La médiane écarte un ralentissement passager de la machine de test.
  return durations.sort((first, second) => first - second)[Math.floor(MEASURES / 2)] ?? Infinity;
}

beforeAll(async () => {
  server = await TestServer.start();
  ada = await registerUser(server, 'ada');
  const board = await BoardFixture.create(server, ada);
  const columns: string[] = [];
  for (let index = 0; index < COLUMN_COUNT; index += 1) {
    columns.push(await board.addColumn(`Colonne ${index}`));
  }
  const cards = Array.from({ length: CARD_COUNT }, (_, index) =>
    createCard(columns[index % COLUMN_COUNT] ?? '', index),
  );
  for (let start = 0; start < CARD_COUNT; start += INSERT_BATCH_SIZE) {
    const data = cards.slice(start, start + INSERT_BATCH_SIZE);
    await server.getDatabase().card.createMany({ data });
  }
}, 60_000);
afterAll(async () => {
  await server.stop();
});

describe(`recherche sur ${CARD_COUNT} cartes`, () => {
  it.each(['pates', 'pain', 'penser semaine', 'fac'])(
    `répond en moins de ${MAX_RESPONSE_MILLISECONDS} ms à « %s »`,
    async (query) => {
      const median = await measure(`/search?${new URLSearchParams({ q: query })}`);
      expect(median).toBeLessThan(MAX_RESPONSE_MILLISECONDS);
    },
  );
});
