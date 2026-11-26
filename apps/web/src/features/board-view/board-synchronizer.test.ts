import type { BoardEvent, BoardViewResponse } from '@handle-it/contracts';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBoardKey, getMoveKey } from '../boards/board-keys';
import { BoardSynchronizer } from './board-synchronizer';

const EVENT: BoardEvent = { type: 'column-created', column: { id: 'A', name: 'A' } };
const createBoard = (version: number): BoardViewResponse => ({
  id: 'board',
  name: 'Maison',
  role: 'owner',
  version,
  labels: [],
  columns: [],
});

let queryClient: QueryClient;
let synchronizer: BoardSynchronizer;
let unsubscribe: () => void;
const fetchBoard = vi.fn<() => Promise<BoardViewResponse>>();

const readBoard = () => queryClient.getQueryData<BoardViewResponse>(getBoardKey('board'));
const receive = (version: number) =>
  synchronizer.receive({ boardId: 'board', version, event: EVENT });

beforeEach(async () => {
  fetchBoard.mockReset().mockResolvedValue(createBoard(3));
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  synchronizer = new BoardSynchronizer(queryClient, 'board');
  const observer = new QueryObserver(queryClient, {
    queryKey: getBoardKey('board'),
    queryFn: fetchBoard,
  });
  unsubscribe = observer.subscribe(() => undefined);
  await vi.waitFor(() => expect(readBoard()).toBeDefined());
  fetchBoard.mockClear();
});
afterEach(() => unsubscribe());

describe('BoardSynchronizer', () => {
  it('applique la version suivante sans relire', () => {
    receive(4);
    expect(readBoard()).toMatchObject({ version: 4, columns: [{ id: 'A' }] });
    expect(fetchBoard).not.toHaveBeenCalled();
  });

  it('ignore une version déjà vue', () => {
    receive(3);
    expect(readBoard()?.columns).toEqual([]);
    expect(fetchBoard).not.toHaveBeenCalled();
  });

  it('relit le board s’il manque une version', async () => {
    fetchBoard.mockResolvedValue(createBoard(6));
    receive(6);
    await vi.waitFor(() => expect(readBoard()?.version).toBe(6));
    expect(fetchBoard).toHaveBeenCalledOnce();
  });

  it('relit le board si la version annoncée à l’entrée est plus récente', async () => {
    fetchBoard.mockResolvedValue(createBoard(5));
    synchronizer.noteVersion(5);
    await vi.waitFor(() => expect(readBoard()?.version).toBe(5));
    synchronizer.noteVersion(5);
    expect(fetchBoard).toHaveBeenCalledOnce();
  });

  it('rattrape un événement arrivé pendant une lecture plus ancienne que lui', async () => {
    let answer: (board: BoardViewResponse) => void = () => undefined;
    fetchBoard.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)));
    synchronizer.reload();
    receive(4);
    answer(createBoard(3));
    await vi.waitFor(() => expect(queryClient.isFetching()).toBe(0));
    fetchBoard.mockResolvedValue(createBoard(4));
    synchronizer.catchUp();
    await vi.waitFor(() => expect(readBoard()?.version).toBe(4));
  });

  it('n’écrase pas un déplacement local en cours', async () => {
    let finish: () => void = () => undefined;
    const mutate = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationKey: getMoveKey('board'),
      mutationFn: mutate,
    });
    const isDone = mutation.execute(undefined);
    await vi.waitFor(() => expect(mutate).toHaveBeenCalled());
    receive(4);
    expect(readBoard()?.version).toBe(3);
    finish();
    await isDone;
    fetchBoard.mockResolvedValue(createBoard(4));
    synchronizer.catchUp();
    await vi.waitFor(() => expect(readBoard()?.version).toBe(4));
  });

  it('n’insiste pas après une lecture en échec', async () => {
    fetchBoard.mockRejectedValue(new Error('réseau'));
    receive(9);
    await vi.waitFor(() => expect(fetchBoard).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(queryClient.isFetching()).toBe(0));
    synchronizer.catchUp();
    expect(fetchBoard).toHaveBeenCalledOnce();
  });
});
