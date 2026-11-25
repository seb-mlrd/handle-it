import { type Columns, findColumnOfCard } from './board-order';
import type { DragItem } from './drag-item';

interface DragPreviewProps {
  readonly item: DragItem;
  readonly columns: Columns;
}

/** Copie visuelle qui suit le pointeur ; l'original garde sa place dans la page. */
export function DragPreview({ item, columns }: DragPreviewProps) {
  if (item.type === 'card') {
    const cards = findColumnOfCard(columns, item.id)?.cards;
    return (
      <div className="cursor-grabbing rounded-control border border-control bg-canvas px-3 py-2.5 wrap-anywhere shadow-lg">
        {cards?.find(({ id }) => id === item.id)?.title}
      </div>
    );
  }
  const column = columns.find(({ id }) => id === item.id);
  return (
    <div className="flex cursor-grabbing flex-col gap-2 rounded-card border border-control bg-surface p-3 shadow-lg">
      <p className="px-1 text-lg font-semibold wrap-anywhere">{column?.name}</p>
      {column?.cards.map((card) => (
        <div
          key={card.id}
          className="rounded-control border border-line bg-canvas px-3 py-2.5 wrap-anywhere"
        >
          {card.title}
        </div>
      ))}
    </div>
  );
}
