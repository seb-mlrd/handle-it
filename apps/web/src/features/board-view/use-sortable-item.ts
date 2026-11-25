import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragItem } from './drag-item';
import { useReducedMotion } from './use-reduced-motion';

const TRANSITION = { duration: 200, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' };

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
