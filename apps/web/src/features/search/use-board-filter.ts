import { useState } from 'react';
import { useDebouncedValue } from '../../shared/time/use-debounced-value';
import { useToday } from '../due-date/use-today';
import { type BoardFilter, EMPTY_BOARD_FILTER, type FilterContext } from './board-filter';
import { isSearchable, SEARCH_DELAY_MILLISECONDS } from './search-text';
import { useBoardSearch } from './use-search';

/** Critères du filtre d'un board ; le texte passe par l'API, le reste par le board chargé. */
export function useBoardFilter(boardId: string) {
  const [filter, setFilter] = useState<BoardFilter>(EMPTY_BOARD_FILTER);
  const today = useToday();
  const text = useDebouncedValue(filter.text.trim(), SEARCH_DELAY_MILLISECONDS);
  const search = useBoardSearch(boardId, text);
  const isTextFiltering = isSearchable(text);
  // Avant la première réponse, le texte ne masque encore rien.
  const context: FilterContext = {
    matchingCardIds: isTextFiltering ? (search.data ?? null) : null,
    today,
  };
  return {
    filter,
    setFilter,
    context,
    textError: isTextFiltering ? search.error : null,
  };
}
