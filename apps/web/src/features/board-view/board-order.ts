import type {
  CardSummaryResponse,
  ColumnViewResponse,
  MoveCardRequest,
  MoveColumnRequest,
} from '@handle-it/contracts';

export type Columns = readonly ColumnViewResponse[];

function insertAt<Item>(items: readonly Item[], index: number, item: Item): Item[] {
  return [...items.slice(0, index), item, ...items.slice(index)];
}

export function findColumnOfCard(columns: Columns, cardId: string): ColumnViewResponse | undefined {
  return columns.find(({ cards }) => cards.some(({ id }) => id === cardId));
}

/** Place une carte à un index de la colonne d'arrivée, compté sans la carte elle-même. */
export function moveCard(
  columns: Columns,
  cardId: string,
  columnId: string,
  index: number,
): ColumnViewResponse[] {
  const card = findColumnOfCard(columns, cardId)?.cards.find(({ id }) => id === cardId);
  if (!card || !columns.some(({ id }) => id === columnId)) return [...columns];
  return columns.map((column) => {
    const cards: CardSummaryResponse[] = column.cards.filter(({ id }) => id !== cardId);
    return { ...column, cards: column.id === columnId ? insertAt(cards, index, card) : cards };
  });
}

/** Place une colonne à un index, compté sans la colonne elle-même. */
export function moveColumn(
  columns: Columns,
  columnId: string,
  index: number,
): ColumnViewResponse[] {
  const column = columns.find(({ id }) => id === columnId);
  if (!column) return [...columns];
  return insertAt(
    columns.filter(({ id }) => id !== columnId),
    index,
    column,
  );
}

/** Indique si deux états placent les mêmes cartes et colonnes aux mêmes endroits. */
export function isSameOrder(first: Columns, second: Columns): boolean {
  const serialize = (columns: Columns) =>
    JSON.stringify(columns.map(({ id, cards }) => [id, cards.map((card) => card.id)]));
  return serialize(first) === serialize(second);
}

/**
 * Rejoue un déplacement de carte sur un board qui a changé entre-temps ; `null` si la carte ou la
 * colonne d'arrivée a disparu.
 */
export function replayCardMove(
  columns: Columns,
  cardId: string,
  request: MoveCardRequest,
): ColumnViewResponse[] | null {
  const target = columns.find(({ id }) => id === request.columnId);
  if (!target || !findColumnOfCard(columns, cardId)) return null;
  const index = findReplayIndex(target.cards, cardId, request.previousCardId, request.nextCardId);
  return moveCard(columns, cardId, target.id, index);
}

/** Rejoue un déplacement de colonne sur un board qui a changé ; `null` si elle a disparu. */
export function replayColumnMove(
  columns: Columns,
  columnId: string,
  request: MoveColumnRequest,
): ColumnViewResponse[] | null {
  if (!columns.some(({ id }) => id === columnId)) return null;
  const index = findReplayIndex(columns, columnId, request.previousColumnId, request.nextColumnId);
  return moveColumn(columns, columnId, index);
}

/** Même règle que l'API : après le précédent, sinon avant le suivant, sinon à la fin. */
function findReplayIndex(
  items: readonly { readonly id: string }[],
  movedId: string,
  previousId: string | null,
  nextId: string | null,
): number {
  const others = items.filter(({ id }) => id !== movedId);
  const previousIndex = others.findIndex(({ id }) => id === previousId);
  if (previousIndex !== -1) return previousIndex + 1;
  const nextIndex = others.findIndex(({ id }) => id === nextId);
  return nextIndex === -1 ? others.length : nextIndex;
}

/** Décrit à l'API la place d'une carte par ses voisines. */
export function describeCardMove(columns: Columns, cardId: string): MoveCardRequest | null {
  const column = findColumnOfCard(columns, cardId);
  if (!column) return null;
  const { previousId, nextId } = findNeighbourIds(column.cards, cardId);
  return { columnId: column.id, previousCardId: previousId, nextCardId: nextId };
}

/** Décrit à l'API la place d'une colonne par ses voisines. */
export function describeColumnMove(columns: Columns, columnId: string): MoveColumnRequest {
  const { previousId, nextId } = findNeighbourIds(columns, columnId);
  return { previousColumnId: previousId, nextColumnId: nextId };
}

function findNeighbourIds(items: readonly { readonly id: string }[], itemId: string) {
  const index = items.findIndex(({ id }) => id === itemId);
  return { previousId: items[index - 1]?.id ?? null, nextId: items[index + 1]?.id ?? null };
}
