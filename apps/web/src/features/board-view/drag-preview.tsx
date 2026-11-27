import { type Columns, findColumnOfCard } from './board-order';
import { CardFace } from './card-face';
import { CARD_CLASS_NAME } from './card-styles';
import type { DragItem } from './drag-item';
import { LIFT_SCALE } from './drop-animation';

interface DragPreviewProps {
  readonly boardId: string;
  readonly item: DragItem;
  readonly columns: Columns;
}

// « cursor-grabbing » repère aussi la copie dans les tests E2E, le temps qu'elle se pose.
const LIFTED_CLASS_NAME = 'drag-lift cursor-grabbing shadow-overlay';
const LIFTED_STYLE = { scale: LIFT_SCALE };

/** Copie visuelle qui suit le pointeur ; l'original garde sa place dans la page. */
export function DragPreview({ boardId, item, columns }: DragPreviewProps) {
  if (item.type === 'card') {
    const card = findColumnOfCard(columns, item.id)?.cards.find(({ id }) => id === item.id);
    return card ? (
      <div className={`${CARD_CLASS_NAME} ${LIFTED_CLASS_NAME}`} style={LIFTED_STYLE}>
        <CardFace boardId={boardId} card={card} />
      </div>
    ) : null;
  }
  const column = columns.find(({ id }) => id === item.id);
  return (
    <div
      className={`flex flex-col gap-2 rounded-card bg-well p-2 ${LIFTED_CLASS_NAME}`}
      style={LIFTED_STYLE}
    >
      <p className="px-2 py-2.5 text-headline font-semibold wrap-anywhere">{column?.name}</p>
      {column?.cards.map((card) => (
        <div key={card.id} className={`${CARD_CLASS_NAME} shadow-raised`}>
          <CardFace boardId={boardId} card={card} />
        </div>
      ))}
    </div>
  );
}
