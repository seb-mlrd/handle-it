import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ColumnViewResponse } from '@handle-it/contracts';
import { AddCard } from './add-card';
import { BoardCard } from './board-card';
import { DROP_SLOT_CLASS_NAME } from './card-styles';
import { ColumnDragHandle } from './column-drag-handle';
import { ColumnHeader } from './column-header';
import { useSortableItem } from './use-sortable-item';

interface BoardColumnProps {
  readonly boardId: string;
  readonly column: ColumnViewResponse;
}

export function BoardColumn({ boardId, column }: BoardColumnProps) {
  const sortable = useSortableItem(
    { type: 'column', id: column.id },
    'button',
    'colonne déplaçable',
  );
  return (
    <li
      ref={sortable.setNodeRef}
      style={sortable.style}
      className={`flex max-h-full w-72 shrink-0 snap-start flex-col gap-2 rounded-card bg-well p-2 ${sortable.isDragging ? DROP_SLOT_CLASS_NAME : ''}`}
    >
      <ColumnHeader
        boardId={boardId}
        column={column}
        handle={
          <ColumnDragHandle
            {...sortable.attributes}
            {...sortable.listeners}
            ref={sortable.setActivatorNodeRef}
            name={column.name}
          />
        }
      />
      {column.cards.length > 0 && (
        <SortableContext
          items={column.cards.map(({ id }) => id)}
          strategy={verticalListSortingStrategy}
        >
          <ul
            aria-label={`Cartes de ${column.name}`}
            className="-m-1 flex min-h-0 flex-col gap-2 overflow-y-auto p-1"
          >
            {column.cards.map((card) => (
              <BoardCard key={card.id} boardId={boardId} columnId={column.id} card={card} />
            ))}
          </ul>
        </SortableContext>
      )}
      <AddCard boardId={boardId} column={column} />
    </li>
  );
}
