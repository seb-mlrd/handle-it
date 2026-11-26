import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import {
  type Columns,
  describeCardMove,
  describeColumnMove,
  findColumnOfCard,
  isSameOrder,
  moveCard,
  moveColumn,
  replayCardMove,
  replayColumnMove,
} from './board-order';
import { type DragItem, getColumnId, readDragItem } from './drag-item';
import { useMove } from './use-move';

interface Draft {
  readonly item: DragItem;
  readonly columns: Columns;
  readonly initialColumns: Columns;
}

/**
 * État du board pendant un glisser-déposer. Le geste se fait sur les cartes visibles ; il se rejoue
 * ensuite sur le board complet par ses voisines visibles, la règle même de l'API.
 */
export function useBoardDrag(
  boardId: string,
  savedColumns: Columns,
  visibleColumns: Columns = savedColumns,
) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const { move, error } = useMove(boardId);
  const columns = draft?.columns ?? visibleColumns;

  const handleDragStart = ({ active }: DragStartEvent) => {
    const item = readDragItem(active);
    if (item) setDraft({ item, columns: visibleColumns, initialColumns: visibleColumns });
  };

  /** Seul le changement de colonne est appliqué en cours de route : la liste gère le reste. */
  const handleDragOver = (event: DragOverEvent) => {
    if (!draft || draft.item.type !== 'card') return;
    const nextColumns = enterColumn(draft, event);
    if (nextColumns) setDraft({ ...draft, columns: nextColumns });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const target = readDragItem(event.over);
    setDraft(null);
    if (!draft || !target) return;
    // Un lâcher très rapide arrive avant l'affichage de la nouvelle colonne : il la rejoue.
    const finalColumns =
      draft.item.type === 'column'
        ? reorderColumn(draft, target)
        : (enterColumn(draft, event) ?? reorderCard(draft, target));
    if (isSameOrder(finalColumns, draft.initialColumns)) return;
    const replayedColumns = replay(draft.item, finalColumns, savedColumns);
    if (replayedColumns) move(draft.item, replayedColumns);
  };

  const cancelDrag = () => setDraft(null);

  return {
    columns,
    draggedItem: draft?.item ?? null,
    error,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    cancelDrag,
  };
}

/** Une carte placée sous le milieu de celle qu'elle survole se range après elle. */
function isBelowMiddle({ active, over }: DragOverEvent | DragEndEvent): boolean {
  const rect = active.rect.current.translated;
  return rect !== null && over !== null && rect.top > over.rect.top + over.rect.height / 2;
}

/** Fait entrer la carte dans la colonne survolée ; `null` si elle y est déjà. */
function enterColumn(
  { item, columns }: Draft,
  event: DragOverEvent | DragEndEvent,
): Columns | null {
  const over = readDragItem(event.over);
  if (!over) return null;
  const targetId = getColumnId(over);
  if (findColumnOfCard(columns, item.id)?.id === targetId) return null;
  const cards = columns.find(({ id }) => id === targetId)?.cards ?? [];
  const overIndex = cards.findIndex(({ id }) => id === over.id);
  const offset = isBelowMiddle(event) ? 1 : 0;
  return moveCard(columns, item.id, targetId, overIndex === -1 ? cards.length : overIndex + offset);
}

function reorderCard({ item, columns }: Draft, target: DragItem): Columns {
  const column = findColumnOfCard(columns, item.id);
  const index = column?.cards.findIndex(({ id }) => id === target.id) ?? -1;
  return column && index !== -1 ? moveCard(columns, item.id, column.id, index) : columns;
}

function reorderColumn({ item, columns }: Draft, target: DragItem): Columns {
  const index = columns.findIndex(({ id }) => id === getColumnId(target));
  return moveColumn(columns, item.id, index);
}

/** Les modifications reçues pendant le geste sont conservées : le geste s'y rejoue. */
function replay(item: DragItem, finalColumns: Columns, savedColumns: Columns): Columns | null {
  if (item.type === 'column') {
    return replayColumnMove(savedColumns, item.id, describeColumnMove(finalColumns, item.id));
  }
  const request = describeCardMove(finalColumns, item.id);
  return request && replayCardMove(savedColumns, item.id, request);
}
