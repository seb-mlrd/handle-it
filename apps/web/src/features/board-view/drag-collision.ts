import {
  closestCenter,
  type CollisionDetection,
  type DroppableContainer,
  pointerWithin,
} from '@dnd-kit/core';
import { getColumnId, readDragItem } from './drag-item';

const isColumn = (container: DroppableContainer) => readDragItem(container)?.type === 'column';

/** Une colonne vise une colonne ; une carte vise d'abord une colonne, puis une carte dedans. */
export const detectCollisions: CollisionDetection = (collision) => {
  const columns = collision.droppableContainers.filter(isColumn);
  const amongColumns = { ...collision, droppableContainers: columns };
  if (readDragItem(collision.active)?.type === 'column') return closestCenter(amongColumns);
  const columnHits = pointerWithin(amongColumns);
  // Sous une colonne courte, ou au clavier, aucun pointeur ne touche de colonne.
  const target = columnHits[0] ?? closestCenter(amongColumns)[0];
  if (!target) return [];
  const cards = collision.droppableContainers.filter((container) => {
    const item = readDragItem(container);
    return item?.type === 'card' && getColumnId(item) === target.id;
  });
  return cards.length > 0 ? closestCenter({ ...collision, droppableContainers: cards }) : [target];
};
