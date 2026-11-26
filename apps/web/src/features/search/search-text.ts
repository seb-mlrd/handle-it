import { SEARCH_QUERY_MAX_LENGTH, SEARCH_QUERY_MIN_LENGTH } from '@handle-it/contracts';

/** Pause de frappe avant d'interroger l'API. */
export const SEARCH_DELAY_MILLISECONDS = 300;

/** Un texte trop court n'interroge pas l'API : il y serait refusé. */
export function isSearchable(text: string): boolean {
  const length = text.trim().length;
  return length >= SEARCH_QUERY_MIN_LENGTH && length <= SEARCH_QUERY_MAX_LENGTH;
}
