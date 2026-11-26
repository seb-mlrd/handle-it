import type { CardViewResponse } from '@handle-it/contracts';
import { Link } from 'react-router';
import { DueDateChip } from '../due-date/due-date-chip';
import { CardLabels } from '../labels/card-labels';
import { useSortableItem } from './use-sortable-item';

interface BoardCardProps {
  readonly boardId: string;
  readonly columnId: string;
  readonly card: CardViewResponse;
}

export function BoardCard({ boardId, columnId, card }: BoardCardProps) {
  const sortable = useSortableItem(
    { type: 'card', id: card.id, columnId },
    'link',
    'carte déplaçable',
  );
  return (
    <li ref={sortable.setNodeRef} style={sortable.style}>
      <Link
        {...sortable.attributes}
        {...sortable.listeners}
        ref={sortable.setActivatorNodeRef}
        to={`/boards/${boardId}/cards/${card.id}`}
        draggable={false}
        className={`block touch-manipulation rounded-control border border-line bg-canvas px-3 py-2.5 wrap-anywhere select-none [-webkit-touch-callout:none] hover:border-control active:border-control ${sortable.isDragging ? 'opacity-40' : ''}`}
      >
        {card.title}
        <CardLabels boardId={boardId} labelIds={card.labelIds} />
        {card.dueOn && <DueDateChip dueOn={card.dueOn} />}
      </Link>
    </li>
  );
}
