import type { BoardViewResponse } from '@handle-it/contracts';
import { AddColumn } from './add-column';
import { BoardColumn } from './board-column';

interface BoardColumnsProps {
  readonly board: BoardViewResponse;
}

export function BoardColumns({ board }: BoardColumnsProps) {
  return (
    <ul
      aria-label="Colonnes"
      className="flex min-h-0 grow snap-x scroll-px-6 items-start gap-4 overflow-x-auto px-6 pb-4"
    >
      {board.columns.map((column) => (
        <BoardColumn key={column.id} boardId={board.id} column={column} />
      ))}
      <AddColumn boardId={board.id} isFirst={board.columns.length === 0} />
    </ul>
  );
}
