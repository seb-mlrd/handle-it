import {
  type ClientRect,
  type DroppableContainer,
  KeyboardCode,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core';
import { getColumnId, readDragItem } from './drag-item';

type Context = Parameters<KeyboardCoordinateGetter>[1]['context'];
interface Target {
  readonly container: DroppableContainer;
  readonly rect: ClientRect;
}

const STEPS: Partial<Record<string, number>> = {
  [KeyboardCode.Left]: -1,
  [KeyboardCode.Up]: -1,
  [KeyboardCode.Right]: 1,
  [KeyboardCode.Down]: 1,
};
const HORIZONTAL_CODES: readonly string[] = [KeyboardCode.Left, KeyboardCode.Right];

function listTargets(
  { droppableContainers, droppableRects }: Context,
  accept: (container: DroppableContainer) => boolean,
): Target[] {
  return droppableContainers.getEnabled().flatMap((container) => {
    const rect = droppableRects.get(container.id);
    return rect && accept(container) ? [{ container, rect }] : [];
  });
}

const listColumns = (context: Context) =>
  listTargets(context, (container) => readDragItem(container)?.type === 'column').sort(
    (first, second) => first.rect.left - second.rect.left,
  );

const listCards = (context: Context, columnId: string) =>
  listTargets(context, (container) => {
    const item = readDragItem(container);
    return item?.type === 'card' && item.columnId === columnId;
  }).sort((first, second) => first.rect.top - second.rect.top);

function findNeighbour(targets: readonly Target[], id: unknown, step: number): Target | undefined {
  const index = targets.findIndex(({ container }) => container.id === id);
  return index === -1 ? undefined : targets[index + step];
}

/** Arrivée dans une colonne : à hauteur de la carte la plus proche. */
function enterColumn(context: Context, column: Target) {
  const top = context.collisionRect?.top ?? column.rect.top;
  const [nearest] = listCards(context, String(column.container.id)).sort(
    (first, second) => Math.abs(first.rect.top - top) - Math.abs(second.rect.top - top),
  );
  return { x: column.rect.left, y: nearest?.rect.top ?? column.rect.top };
}

/** Flèches verticales : parmi les cartes de la colonne. Horizontales : d'une colonne à l'autre. */
export const getKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  const step = STEPS[event.code];
  const active = readDragItem(context.active);
  const over = readDragItem(context.over) ?? active;
  if (!step || !active || !over) return undefined;
  event.preventDefault();
  if (HORIZONTAL_CODES.includes(event.code)) {
    const column = findNeighbour(listColumns(context), getColumnId(over), step);
    if (!column) return undefined;
    return active.type === 'column'
      ? { x: column.rect.left, y: column.rect.top }
      : enterColumn(context, column);
  }
  if (active.type === 'column') return undefined;
  const card = findNeighbour(listCards(context, getColumnId(over)), over.id, step);
  if (!card) return undefined;
  // Aligné sur le bord d'arrivée : des cartes de hauteurs différentes ne faussent pas la cible.
  const height = context.collisionRect?.height ?? card.rect.height;
  return { x: card.rect.left, y: step > 0 ? card.rect.bottom - height : card.rect.top };
};
