import type { BoardViewResponse } from '@handle-it/contracts';
import type { TestServer } from './test-server.js';

/** Board de test piloté par l'API, dont l'ordre se lit d'un coup d'œil. */
export class BoardFixture {
  private constructor(
    private readonly server: TestServer,
    private readonly cookie: string,
    private readonly boardId: string,
  ) {}

  static async create(server: TestServer, cookie: string): Promise<BoardFixture> {
    const boardId = await BoardFixture.post(server, cookie, '/boards', { name: 'Test' });
    return new BoardFixture(server, cookie, boardId);
  }

  getId(): string {
    return this.boardId;
  }

  getPath(): string {
    return `/boards/${this.boardId}`;
  }

  addColumn(name: string): Promise<string> {
    return BoardFixture.post(this.server, this.cookie, `${this.getPath()}/columns`, { name });
  }

  addCard(columnId: string, title: string): Promise<string> {
    const path = `${this.getPath()}/columns/${columnId}/cards`;
    return BoardFixture.post(this.server, this.cookie, path, { title });
  }

  /** Renvoie par exemple `['A: 1 2', 'B: 3']`. */
  async readOrder(): Promise<string[]> {
    const response = await this.server.send('GET', this.getPath(), { cookie: this.cookie });
    const { columns } = (await response.json()) as BoardViewResponse;
    return columns.map(({ name, cards }) =>
      `${name}: ${cards.map(({ title }) => title).join(' ')}`.trim(),
    );
  }

  private static async post(
    server: TestServer,
    cookie: string,
    path: string,
    body: unknown,
  ): Promise<string> {
    const response = await server.send('POST', path, { cookie, body });
    return ((await response.json()) as { id: string }).id;
  }
}
