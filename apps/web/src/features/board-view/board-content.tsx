import type { BoardViewResponse } from '@handle-it/contracts';
import { Link, Outlet } from 'react-router';
import { BoardColumns } from './board-columns';
import { ConnectionIndicator } from './connection-indicator';
import { useBoardRealtime } from './use-board-realtime';

interface BoardContentProps {
  readonly board: BoardViewResponse;
}

/** Board chargé, suivi en direct tant qu'il est affiché. */
export function BoardContent({ board }: BoardContentProps) {
  const status = useBoardRealtime(board);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 px-6">
        <h1 className="text-display font-bold wrap-anywhere">{board.name}</h1>
        <div className="flex flex-wrap items-center gap-4">
          <ConnectionIndicator status={status} />
          <Link
            to={`/boards/${board.id}/activity`}
            className="flex h-11 items-center rounded-control border border-control bg-surface px-4 font-semibold hover:bg-canvas"
          >
            Activité
          </Link>
          <Link
            to={`/boards/${board.id}/members`}
            className="flex h-11 items-center rounded-control border border-control bg-surface px-4 font-semibold hover:bg-canvas"
          >
            Membres
          </Link>
        </div>
      </div>
      <BoardColumns boardId={board.id} />
      <Outlet />
    </>
  );
}
