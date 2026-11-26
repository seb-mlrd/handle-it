import type {
  BoardEvent,
  BoardViewResponse,
  CardViewResponse,
  LabelResponse,
} from '@handle-it/contracts';
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
  return {
    ...board,
    name,
    version,
    labels: applyToLabels(board.labels, event),
    columns: [...applyToColumns(board.columns, event)],
  };
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
        column.id === event.columnId
          ? { ...column, cards: [...column.cards, { ...event.card, labelIds: [] }] }
          : column,
      );
    case 'card-updated':
      return columns.map((column) => ({
        ...column,
        cards: column.cards.map((card) =>
          card.id === event.card.id ? { ...card, ...event.card } : card,
        ),
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
    case 'card-labels-changed':
      return updateCards(columns, (card) =>
        card.id === event.cardId ? { ...card, labelIds: event.labelIds } : card,
      );
    case 'label-deleted':
      return updateCards(columns, (card) => ({
        ...card,
        labelIds: card.labelIds.filter((id) => id !== event.labelId),
      }));
    default:
      return columns;
  }
}

function updateCards(
  columns: Columns,
  update: (card: CardViewResponse) => CardViewResponse,
): Columns {
  return columns.map((column) => ({ ...column, cards: column.cards.map(update) }));
}

function applyToLabels(labels: readonly LabelResponse[], event: BoardEvent): LabelResponse[] {
  switch (event.type) {
    case 'label-created':
      return sortByName([...labels, event.label]);
    case 'label-updated':
      return sortByName(labels.map((label) => (label.id === event.label.id ? event.label : label)));
    case 'label-deleted':
      return labels.filter(({ id }) => id !== event.labelId);
    default:
      return [...labels];
  }
}

/** Même ordre que l'API : par nom, sans tenir compte de la casse. */
function sortByName(labels: LabelResponse[]): LabelResponse[] {
  return labels.sort((first, second) => first.name.localeCompare(second.name, 'fr-FR'));
}

/** Index après un élément, compté sans l'élément déplacé. */
function findIndexAfter(
  items: readonly { readonly id: string }[],
  movedId: string,
  previousId: string | null,
): number {
  return items.filter(({ id }) => id !== movedId).findIndex(({ id }) => id === previousId) + 1;
}
