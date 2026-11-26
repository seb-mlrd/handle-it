import type { DueWindow } from './due-window.value-object.js';
import type { SearchQuery } from './search-query.value-object.js';
import type { SearchResult } from './search-result.js';

export interface SearchCriteria {
  /** Seuls les boards dont cet utilisateur est membre sont lus. */
  readonly userId: string;
  /** Limite la recherche à un board ; `null` cherche dans tous ceux de l'utilisateur. */
  readonly boardId: string | null;
  readonly query: SearchQuery;
  readonly due: DueWindow | null;
  /** Cartes portant au moins un de ces labels ; vide pour ne pas filtrer. */
  readonly labelIds: readonly string[];
  readonly limit: number;
}

export abstract class SearchRepository {
  /** Renvoie les cartes trouvées, de la plus pertinente à la moins pertinente. */
  abstract search(criteria: SearchCriteria): Promise<SearchResult[]>;
}
