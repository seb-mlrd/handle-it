import { createContext, useContext } from 'react';
import type { SearchGateway } from './search-gateway';

export const SearchGatewayContext = createContext<SearchGateway | null>(null);

export function useSearchGateway(): SearchGateway {
  const searchGateway = useContext(SearchGatewayContext);
  if (!searchGateway) {
    throw new Error('SearchGatewayContext doit être fourni au-dessus de ce composant');
  }
  return searchGateway;
}
