import { randomUUID } from 'node:crypto';
import type { BoardViewResponse, LabelResponse } from '@handle-it/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addMember, registerUser } from '../testing/accounts.js';
import { BoardFixture } from '../testing/board-fixture.js';
import { RealtimeClient } from '../testing/realtime-client.js';
import { TestServer } from '../testing/test-server.js';

let server: TestServer;
let ada: string;
let bob: string;
let board: BoardFixture;
let card: string;

const send = (method: string, path: string, body?: unknown, cookie = ada) =>
  server.send(method, `${board.getPath()}${path}`, { cookie, body });

async function createLabel(name: string, color = 'red'): Promise<LabelResponse> {
  return (await (await send('POST', '/labels', { name, color })).json()) as LabelResponse;
}

async function readView(): Promise<BoardViewResponse> {
  return (await (await send('GET', '')).json()) as BoardViewResponse;
}

const readCardLabels = async () => (await readView()).columns[0]?.cards[0]?.labelIds;

beforeEach(async () => {
  server = await TestServer.start();
  ada = await registerUser(server, 'ada');
  bob = await registerUser(server, 'bob');
  board = await BoardFixture.create(server, ada);
  card = await board.addCard(await board.addColumn('A'), 'Pain');
});
afterEach(async () => {
  await server.stop();
});

describe('labels du board', () => {
  it('se créent, se modifient et se listent par nom', async () => {
    const urgent = await createLabel('urgent');
    await createLabel('Calme', 'green');
    const updated = await send('PATCH', `/labels/${urgent.id}`, {
      name: 'Urgent',
      color: 'orange',
    });
    expect(await updated.json()).toEqual({ id: urgent.id, name: 'Urgent', color: 'orange' });
    expect((await readView()).labels.map(({ name }) => name)).toEqual(['Calme', 'Urgent']);
  });

  it('refusent un nom déjà pris, quelle que soit la casse', async () => {
    await createLabel('Urgent');
    const response = await send('POST', '/labels', { name: 'URGENT', color: 'blue' });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code: 'LABEL_NAME_TAKEN' });
  });

  it('refusent une couleur inconnue ou un nom vide', async () => {
    expect((await send('POST', '/labels', { name: 'Violet', color: 'violet' })).status).toBe(400);
    expect((await send('POST', '/labels', { name: ' ', color: 'red' })).status).toBe(400);
  });
});

describe('labels sur une carte', () => {
  it('se posent et se retirent, sans doublon', async () => {
    const urgent = await createLabel('Urgent');
    const calme = await createLabel('Calme', 'green');
    expect(await (await send('PUT', `/cards/${card}/labels/${urgent.id}`)).json()).toEqual([
      urgent.id,
    ]);
    await send('PUT', `/cards/${card}/labels/${urgent.id}`);
    await send('PUT', `/cards/${card}/labels/${calme.id}`);
    expect(await readCardLabels()).toEqual([calme.id, urgent.id]);
    expect(await (await send('DELETE', `/cards/${card}/labels/${urgent.id}`)).json()).toEqual([
      calme.id,
    ]);
    expect((await send('DELETE', `/cards/${card}/labels/${urgent.id}`)).status).toBe(200);
  });

  it('disparaissent des cartes quand le label est supprimé', async () => {
    const urgent = await createLabel('Urgent');
    await send('PUT', `/cards/${card}/labels/${urgent.id}`);
    expect((await send('DELETE', `/labels/${urgent.id}`)).status).toBe(204);
    expect(await readCardLabels()).toEqual([]);
    expect((await readView()).labels).toEqual([]);
  });

  it('refusent un label ou une carte d’un autre board', async () => {
    const other = await BoardFixture.create(server, ada);
    const foreign = (await (
      await server.send('POST', `${other.getPath()}/labels`, {
        cookie: ada,
        body: { name: 'Ailleurs', color: 'blue' },
      })
    ).json()) as LabelResponse;
    const foreignCard = await other.addCard(await other.addColumn('X'), 'Ailleurs');
    const own = await createLabel('Urgent');
    expect((await send('PUT', `/cards/${card}/labels/${foreign.id}`)).status).toBe(404);
    expect((await send('PUT', `/cards/${foreignCard}/labels/${own.id}`)).status).toBe(404);
    expect((await send('PATCH', `/labels/${foreign.id}`, { name: 'X', color: 'red' })).status).toBe(
      404,
    );
    expect(await readCardLabels()).toEqual([]);
  });
});

describe('temps réel et historique', () => {
  it('annonce chaque changement et l’inscrit à l’historique', async () => {
    const client = await RealtimeClient.connect(server, ada);
    await client.join({ boardId: board.getId() });
    const urgent = await createLabel('Urgent');
    await send('PUT', `/cards/${card}/labels/${urgent.id}`);
    await send('DELETE', `/cards/${card}/labels/${urgent.id}`);
    await send('PATCH', `/labels/${urgent.id}`, { name: 'Très urgent', color: 'red' });
    await send('DELETE', `/labels/${urgent.id}`);
    await vi.waitFor(() => expect(client.envelopes).toHaveLength(5));
    expect(client.envelopes.map(({ event }) => event.type)).toEqual([
      'label-created',
      'card-labels-changed',
      'card-labels-changed',
      'label-updated',
      'label-deleted',
    ]);
    client.close();
    const history = (await (await send('GET', '/activities')).json()) as {
      items: { details: Record<string, string> }[];
    };
    expect(
      history.items
        .slice(0, 5)
        .map(({ details }) => details)
        .reverse(),
    ).toEqual([
      { type: 'label-created', labelName: 'Urgent' },
      { type: 'card-label-added', cardTitle: 'Pain', labelName: 'Urgent' },
      { type: 'card-label-removed', cardTitle: 'Pain', labelName: 'Urgent' },
      { type: 'label-updated', labelName: 'Très urgent' },
      { type: 'label-deleted', labelName: 'Très urgent' },
    ]);
  });
});

describe('droits', () => {
  it('un membre gère les labels, un non-membre n’accède à rien', async () => {
    const urgent = await createLabel('Urgent');
    const attempts = (cookie: string) =>
      Promise.all([
        send('GET', '/labels', undefined, cookie),
        send('POST', '/labels', { name: `De ${randomUUID().slice(0, 4)}`, color: 'teal' }, cookie),
        send('PUT', `/cards/${card}/labels/${urgent.id}`, undefined, cookie),
      ]).then((responses) => responses.map(({ status }) => status));
    expect(await attempts(bob)).toEqual([404, 404, 404]);
    expect(await attempts('')).toEqual([401, 401, 401]);
    await addMember(server, board.getId(), 'bob');
    expect(await attempts(bob)).toEqual([200, 201, 200]);
  });
});
