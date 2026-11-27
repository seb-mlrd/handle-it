import type { CardViewResponse } from '@handle-it/contracts';
import { Link } from 'react-router';
import { CardFace } from './card-face';
import { CARD_CLASS_NAME, DROP_SLOT_CLASS_NAME } from './card-styles';
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
        className={`${CARD_CLASS_NAME} touch-manipulation shadow-raised transition-[box-shadow,translate,scale] select-none [-webkit-touch-callout:none] hover:shadow-lifted motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.98] motion-safe:active:duration-100 motion-reduce:transition-none ${sortable.isDragging ? DROP_SLOT_CLASS_NAME : ''}`}
      >
        <CardFace boardId={boardId} card={card} />
      </Link>
    </li>
  );
}
