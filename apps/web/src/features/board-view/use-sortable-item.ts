import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragItem } from './drag-item';
import { useReducedMotion } from './use-reduced-motion';

// Écrit dans un style en ligne : var() s'y résout, la courbe reste celle d'index.css.
const TRANSITION = { duration: 340, easing: 'var(--ease-spring)' };

/** Élément triable, immobile si l'utilisateur limite les animations. */
export function useSortableItem(item: DragItem, role: string, roleDescription: string) {
  const isMotionReduced = useReducedMotion();
  const sortable = useSortable({
    id: item.id,
    data: { item },
    transition: isMotionReduced ? null : TRANSITION,
    attributes: { role, roleDescription },
  });
  return {
    ...sortable,
    style: {
      transform: CSS.Translate.toString(sortable.transform),
      transition: sortable.transition,
    },
  };
}
