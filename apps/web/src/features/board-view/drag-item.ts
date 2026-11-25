import type { Active, Over } from '@dnd-kit/core';

/** Élément déplaçable, tel qu'il est confié à dnd-kit. */
export type DragItem =
  | { readonly type: 'card'; readonly id: string; readonly columnId: string }
  | { readonly type: 'column'; readonly id: string };

interface DragEntry {
  readonly data: { readonly current?: Record<string, unknown> | undefined };
}

/** Relit l'élément : dnd-kit ne conserve pas le type des données. */
export function readDragItem(entry: Active | Over | DragEntry | null): DragItem | null {
  const item = entry?.data.current?.['item'];
  return item ? (item as DragItem) : null;
}

/** Colonne désignée par un élément : elle-même, ou celle de la carte. */
export function getColumnId(item: DragItem): string {
  return item.type === 'card' ? item.columnId : item.id;
}
