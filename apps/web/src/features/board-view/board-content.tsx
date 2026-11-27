import type { BoardViewResponse } from '@handle-it/contracts';
import { Link, Outlet } from 'react-router';
import { getButtonClassName } from '../../shared/ui/button-styles';
import { Icon, type IconName } from '../../shared/ui/icon';
import { countCards, filterColumns, isBoardFilterActive } from '../search/board-filter';
import { BoardFilterBar } from '../search/board-filter-bar';
import { useBoardFilter } from '../search/use-board-filter';
import { BoardColumns } from './board-columns';
import type { Columns } from './board-order';
import { ConnectionIndicator } from './connection-indicator';
import { useBoardRealtime } from './use-board-realtime';

const BOARD_TOOLS: readonly { label: string; path: string; icon: IconName }[] = [
  { label: 'Labels', path: 'labels', icon: 'tag' },
  { label: 'Activité', path: 'activity', icon: 'activity' },
  { label: 'Membres', path: 'members', icon: 'members' },
];

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
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-display font-bold wrap-anywhere">{board.name}</h1>
          <ConnectionIndicator status={status} />
        </div>
        <nav aria-label="Outils du tableau" className="flex flex-wrap gap-2">
          {BOARD_TOOLS.map((tool) => (
            <Link
              key={tool.path}
              to={`/boards/${board.id}/${tool.path}`}
              className={getButtonClassName('secondary')}
            >
              <Icon name={tool.icon} className="size-[1.125rem] text-muted" />
              <span className="max-sm:sr-only">{tool.label}</span>
            </Link>
          ))}
        </nav>
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
