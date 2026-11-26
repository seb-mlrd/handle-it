import type { CardViewResponse, DueFilter } from '@handle-it/contracts';
import type { Columns } from '../board-view/board-order';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;

export interface BoardFilter {
  readonly text: string;
  /** Une carte est gardée si elle porte au moins un de ces labels. */
  readonly labelIds: readonly string[];
  readonly due: DueFilter | null;
}

export const EMPTY_BOARD_FILTER: BoardFilter = { text: '', labelIds: [], due: null };

export interface FilterContext {
  /** Cartes qui contiennent le texte cherché ; `null` quand le texte ne filtre pas. */
  readonly matchingCardIds: ReadonlySet<string> | null;
  /** Jour local du visiteur (AAAA-MM-JJ). */
  readonly today: string;
}

const toTime = (date: string) => new Date(`${date}T00:00:00.000Z`).getTime();

/** Dimanche de la semaine de `today`, celle qui va du lundi au dimanche. */
export function getEndOfWeek(today: string): string {
  const time = toTime(today);
  const isoWeekday = new Date(time).getUTCDay() || DAYS_PER_WEEK;
  return new Date(time + (DAYS_PER_WEEK - isoWeekday) * DAY_MILLISECONDS)
    .toISOString()
    .slice(0, 10);
}

/** Même règle que l'API : « cette semaine » va d'aujourd'hui à dimanche, sans les retards. */
export function matchesDue(dueOn: string | null, due: DueFilter, today: string): boolean {
  switch (due) {
    case 'overdue':
      return dueOn !== null && dueOn < today;
    case 'this-week':
      return dueOn !== null && dueOn >= today && dueOn <= getEndOfWeek(today);
    case 'none':
      return dueOn === null;
  }
}

function matches(card: CardViewResponse, filter: BoardFilter, context: FilterContext): boolean {
  if (context.matchingCardIds && !context.matchingCardIds.has(card.id)) return false;
  if (filter.labelIds.length > 0 && !filter.labelIds.some((id) => card.labelIds.includes(id))) {
    return false;
  }
  return filter.due === null || matchesDue(card.dueOn, filter.due, context.today);
}

/** Vrai dès qu'un critère restreint les cartes affichées. */
export function isBoardFilterActive(filter: BoardFilter, context: FilterContext): boolean {
  return context.matchingCardIds !== null || filter.labelIds.length > 0 || filter.due !== null;
}

/**
 * Colonnes avec seulement les cartes gardées ; aucune colonne n'est masquée. Un déplacement fait
 * sur cette vue se rejoue sur le board complet par ses voisines visibles, comme le fait l'API.
 */
export function filterColumns(
  columns: Columns,
  filter: BoardFilter,
  context: FilterContext,
): Columns {
  if (!isBoardFilterActive(filter, context)) return columns;
  return columns.map((column) => ({
    ...column,
    cards: column.cards.filter((card) => matches(card, filter, context)),
  }));
}

export function countCards(columns: Columns): number {
  return columns.reduce((total, { cards }) => total + cards.length, 0);
}
