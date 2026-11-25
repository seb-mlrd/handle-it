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
