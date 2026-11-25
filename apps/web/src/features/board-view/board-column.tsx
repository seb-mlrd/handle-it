import type { ColumnViewResponse } from '@handle-it/contracts';
import { Link } from 'react-router';
import { AddCard } from './add-card';
import { ColumnHeader } from './column-header';

interface BoardColumnProps {
  readonly boardId: string;
  readonly column: ColumnViewResponse;
}

export function BoardColumn({ boardId, column }: BoardColumnProps) {
  return (
    <li className="flex max-h-full w-72 shrink-0 snap-start flex-col gap-3 rounded-card border border-line bg-surface p-3">
      <ColumnHeader boardId={boardId} column={column} />
      {column.cards.length > 0 && (
        <ul
          aria-label={`Cartes de ${column.name}`}
          className="flex min-h-0 flex-col gap-2 overflow-y-auto p-0.5"
        >
          {column.cards.map((card) => (
            <li key={card.id}>
              <Link
                to={`/boards/${boardId}/cards/${card.id}`}
                className="block rounded-control border border-line bg-canvas px-3 py-2.5 wrap-anywhere hover:border-control"
              >
                {card.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <AddCard boardId={boardId} column={column} />
    </li>
  );
}
