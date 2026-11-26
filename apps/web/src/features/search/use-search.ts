import type { SearchResponse } from '@handle-it/contracts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getBoardKey } from '../boards/board-keys';
import type { SearchParameters } from './search-gateway';
import { useSearchGateway } from './search-gateway-context';
import { isSearchable } from './search-text';

// Hors du composant : une même fonction de sélection garde le même ensemble d'un rendu à l'autre.
const selectCardIds = ({ results }: SearchResponse): ReadonlySet<string> =>
  new Set(results.map(({ cardId }) => cardId));

/** Résultats dans tous les boards ; les précédents restent affichés pendant la recherche suivante. */
export function useSearch(parameters: SearchParameters) {
  const gateway = useSearchGateway();
  const query = parameters.query.trim();
  return useQuery({
    queryKey: ['search', query, parameters.due, parameters.due ? parameters.today : null],
    queryFn: () => gateway.searchEverywhere({ ...parameters, query }),
    enabled: isSearchable(query),
    placeholderData: keepPreviousData,
  });
}

/** Cartes d'un board qui contiennent le texte, pour son filtre. */
export function useBoardSearch(boardId: string, text: string) {
  const gateway = useSearchGateway();
  const query = text.trim();
  return useQuery({
    // Rangée sous le board : une modification reçue en direct la fait relire.
    queryKey: [...getBoardKey(boardId), 'search', query],
    queryFn: () => gateway.searchBoard(boardId, query),
    enabled: isSearchable(query),
    placeholderData: keepPreviousData,
    select: selectCardIds,
  });
}
