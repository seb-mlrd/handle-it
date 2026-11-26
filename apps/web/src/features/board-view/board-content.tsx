import type { BoardViewResponse } from '@handle-it/contracts';
import { Link, Outlet } from 'react-router';
import { countCards, filterColumns, isBoardFilterActive } from '../search/board-filter';
import { BoardFilterBar } from '../search/board-filter-bar';
import { useBoardFilter } from '../search/use-board-filter';
import { BoardColumns } from './board-columns';
import type { Columns } from './board-order';
import { ConnectionIndicator } from './connection-indicator';
import { useBoardRealtime } from './use-board-realtime';

interface BoardContentProps {
  readonly board: BoardViewResponse;
}

/** Board chargé, suivi en direct tant qu'il est affiché. */
export function BoardContent({ board }: BoardContentProps) {
  const status = useBoardRealtime(board);
  const boardFilter = useBoardFilter(board.id);
  const { filter, context } = boardFilter;
  const selectVisibleColumns = (columns: Columns) => filterColumns(columns, filter, context);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 px-6">
        <h1 className="text-display font-bold wrap-anywhere">{board.name}</h1>
        <div className="flex flex-wrap items-center gap-4">
          <ConnectionIndicator status={status} />
          <Link
            to={`/boards/${board.id}/labels`}
            className="flex h-11 items-center rounded-control border border-control bg-surface px-4 font-semibold hover:bg-canvas"
          >
            Labels
          </Link>
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
      <BoardFilterBar
        boardId={board.id}
        filter={filter}
        change={boardFilter.setFilter}
        isActive={isBoardFilterActive(filter, context)}
        shownCount={countCards(selectVisibleColumns(board.columns))}
        totalCount={countCards(board.columns)}
        textError={boardFilter.textError}
      />
      <BoardColumns boardId={board.id} selectVisibleColumns={selectVisibleColumns} />
      <Outlet />
    </>
  );
}
