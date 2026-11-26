import type { BoardEvent, BoardViewResponse } from '@handle-it/contracts';
import { type Columns, moveCard, moveColumn } from './board-order';

export type EnvelopeDecision = 'apply' | 'ignore' | 'reload';

/** Les versions se suivent : une déjà vue s'ignore, une manquante impose de relire le board. */
export function decideOnVersion(currentVersion: number, eventVersion: number): EnvelopeDecision {
  if (eventVersion <= currentVersion) return 'ignore';
  return eventVersion === currentVersion + 1 ? 'apply' : 'reload';
}

/** Applique la modification d'un autre membre au board affiché. */
export function applyBoardEvent(
  board: BoardViewResponse,
  version: number,
  event: BoardEvent,
): BoardViewResponse {
  const name = event.type === 'board-renamed' ? event.name : board.name;
  return { ...board, name, version, columns: [...applyToColumns(board.columns, event)] };
}

function applyToColumns(columns: Columns, event: BoardEvent): Columns {
  switch (event.type) {
    case 'column-created':
      return [...columns, { ...event.column, cards: [] }];
    case 'column-renamed':
      return columns.map((column) =>
        column.id === event.column.id ? { ...column, ...event.column } : column,
      );
    case 'column-deleted':
      return columns.filter(({ id }) => id !== event.columnId);
    case 'column-moved':
      return moveColumn(
        columns,
        event.columnId,
        findIndexAfter(columns, event.columnId, event.previousColumnId),
      );
    default:
      return applyToCards(columns, event);
  }
}

function applyToCards(columns: Columns, event: BoardEvent): Columns {
  switch (event.type) {
    case 'card-created':
      return columns.map((column) =>
        column.id === event.columnId ? { ...column, cards: [...column.cards, event.card] } : column,
      );
    case 'card-updated':
      return columns.map((column) => ({
        ...column,
        cards: column.cards.map((card) => (card.id === event.card.id ? event.card : card)),
      }));
    case 'card-deleted':
      return columns.map((column) => ({
        ...column,
        cards: column.cards.filter(({ id }) => id !== event.cardId),
      }));
    case 'card-moved': {
      const cards = columns.find(({ id }) => id === event.columnId)?.cards ?? [];
      const index = findIndexAfter(cards, event.cardId, event.previousCardId);
      return moveCard(columns, event.cardId, event.columnId, index);
    }
    default:
      return columns;
  }
}

/** Index après un élément, compté sans l'élément déplacé. */
function findIndexAfter(
  items: readonly { readonly id: string }[],
  movedId: string,
  previousId: string | null,
): number {
  return items.filter(({ id }) => id !== movedId).findIndex(({ id }) => id === previousId) + 1;
}
