import type { LabelResponse, SearchResponse } from '@handle-it/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addMember, registerUser } from '../testing/accounts.js';
import { BoardFixture } from '../testing/board-fixture.js';
import { TestServer } from '../testing/test-server.js';
import { SEARCH_REQUESTS_LIMIT } from './search.controller.js';

let server: TestServer;
let ada: string;
let board: BoardFixture;
let column: string;

async function search(path: string, cookie = ada): Promise<SearchResponse> {
  return (await (await server.send('GET', path, { cookie })).json()) as SearchResponse;
}

const searchEverywhere = (query: string, cookie = ada) =>
  search(`/search?${new URLSearchParams({ q: query })}`, cookie);

const titles = async (path: string) =>
  (await search(path)).results.map(({ cardTitle }) => cardTitle);

const send = (method: string, path: string, body?: unknown) =>
  server.send(method, `${board.getPath()}${path}`, { cookie: ada, body });

beforeEach(async () => {
  server = await TestServer.start();
  ada = await registerUser(server, 'ada');
  board = await BoardFixture.create(server, ada);
  column = await board.addColumn('À faire');
});
afterEach(async () => {
  await server.stop();
});

describe('recherche', () => {
  it('trouve sans tenir compte des accents ni de la casse, et met le mot en évidence', async () => {
    await board.addCard(column, 'Acheter des Pâtes fraîches');
    await board.addCard(column, 'Lait');
    const { results } = await searchEverywhere('pates');
    expect(results).toEqual([
      {
        cardId: expect.any(String),
        cardTitle: 'Acheter des Pâtes fraîches',
        boardId: board.getId(),
        boardName: 'Test',
        columnName: 'À faire',
        matchedIn: 'title',
        excerpt: [
          { text: 'Acheter des ', isMatch: false },
          { text: 'Pâtes', isMatch: true },
          { text: ' fraîches', isMatch: false },
        ],
      },
    ]);
  });

  it('trouve un début de mot, et exige tous les mots', async () => {
    await board.addCard(column, 'Pain complet');
    await board.addCard(column, 'Pain blanc');
    expect(await titles('/search?q=pai')).toEqual(expect.arrayContaining(['Pain complet']));
    expect(await titles('/search?q=pain%20compl')).toEqual(['Pain complet']);
  });

  it('cherche aussi dans la description et les commentaires', async () => {
    const described = await board.addCard(column, 'Courses');
    await send('PATCH', `/cards/${described}`, {
      title: 'Courses',
      description: 'Ne pas oublier la farine pour le gâteau du dimanche',
    });
    const commented = await board.addCard(column, 'Anniversaire');
    await send('POST', `/cards/${commented}/comments`, { body: 'Il faut un gâteau au chocolat' });
    const { results } = await searchEverywhere('gateau');
    expect(results.map(({ cardTitle, matchedIn }) => `${cardTitle} : ${matchedIn}`).sort()).toEqual(
      ['Anniversaire : comment', 'Courses : description'],
    );
    const excerpt = results.find(({ matchedIn }) => matchedIn === 'comment')?.excerpt;
    expect(excerpt?.filter(({ isMatch }) => isMatch).map(({ text }) => text)).toEqual(['gâteau']);
  });

  it('rend le texte tel quel, même quand il ressemble à du HTML', async () => {
    await board.addCard(column, '<b>Pain</b> & <script>');
    const [result] = (await searchEverywhere('pain')).results;
    expect(result?.excerpt.map(({ text }) => text).join('')).toBe('<b>Pain</b> & <script>');
  });

  it('refuse une recherche trop courte, trop longue ou sans mot', async () => {
    for (const query of ['a', 'a'.repeat(101), '!! ?']) {
      const response = await server.send('GET', `/search?${new URLSearchParams({ q: query })}`, {
        cookie: ada,
      });
      expect(response.status).toBe(400);
    }
  });
});

describe('portée', () => {
  it('ne montre jamais une carte d’un board dont on n’est pas membre', async () => {
    const bob = await registerUser(server, 'bob');
    const bobBoard = await BoardFixture.create(server, bob);
    await bobBoard.addCard(await bobBoard.addColumn('Bob'), 'Pain de Bob');
    await board.addCard(column, 'Pain de Ada');
    expect(await titles('/search?q=pain')).toEqual(['Pain de Ada']);
    await addMember(server, board.getId(), 'bob');
    expect(
      (await searchEverywhere('pain', bob)).results.map(({ cardTitle }) => cardTitle).sort(),
    ).toEqual(['Pain de Ada', 'Pain de Bob']);
    expect((await search(`${bobBoard.getPath()}/search?q=pain`)).results).toBeUndefined();
    const status = (
      await server.send('GET', `${bobBoard.getPath()}/search?q=pain`, { cookie: ada })
    ).status;
    expect(status).toBe(404);
    expect((await server.send('GET', '/search?q=pain', { cookie: '' })).status).toBe(401);
  });

  it('se limite au board demandé', async () => {
    const other = await BoardFixture.create(server, ada);
    await other.addCard(await other.addColumn('Ailleurs'), 'Pain ailleurs');
    await board.addCard(column, 'Pain ici');
    expect(await titles(`${board.getPath()}/search?q=pain`)).toEqual(['Pain ici']);
  });
});

describe('filtres', () => {
  it('filtre par échéance, vue depuis le jour du visiteur', async () => {
    const dates = {
      'Pain en retard': '2026-11-25',
      'Pain aujourd’hui': '2026-11-26',
      'Pain dimanche': '2026-11-29',
      'Pain lundi': '2026-11-30',
    };
    for (const [title, dueOn] of Object.entries(dates)) {
      const card = await board.addCard(column, title);
      await send('PUT', `/cards/${card}/due-date`, { dueOn });
    }
    await board.addCard(column, 'Pain sans date');
    const filtered = (due: string) => titles(`/search?q=pain&due=${due}&today=2026-11-26`);
    expect(await filtered('overdue')).toEqual(['Pain en retard']);
    expect((await filtered('this-week')).sort()).toEqual(['Pain aujourd’hui', 'Pain dimanche']);
    expect(await filtered('none')).toEqual(['Pain sans date']);
    expect((await server.send('GET', '/search?q=pain&due=none', { cookie: ada })).status).toBe(400);
  });

  it('filtre par label dans un board', async () => {
    const label = (await (
      await send('POST', '/labels', { name: 'Urgent', color: 'red' })
    ).json()) as LabelResponse;
    const urgent = await board.addCard(column, 'Pain urgent');
    await board.addCard(column, 'Pain calme');
    await send('PUT', `/cards/${urgent}/labels/${label.id}`);
    expect(await titles(`${board.getPath()}/search?q=pain&labelIds=${label.id}`)).toEqual([
      'Pain urgent',
    ]);
  });
});

it('limite la fréquence des recherches par utilisateur', async () => {
  const statuses: number[] = [];
  for (let index = 0; index <= SEARCH_REQUESTS_LIMIT; index += 1) {
    statuses.push((await server.send('GET', '/search?q=pain', { cookie: ada })).status);
  }
  expect(statuses.slice(0, SEARCH_REQUESTS_LIMIT).every((status) => status === 200)).toBe(true);
  expect(statuses.at(-1)).toBe(429);
  const bob = await registerUser(server, 'bob');
  expect((await server.send('GET', '/search?q=pain', { cookie: bob })).status).toBe(200);
});
