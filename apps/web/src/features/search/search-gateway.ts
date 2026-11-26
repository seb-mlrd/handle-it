import { type DueFilter, type SearchResponse, searchResponseSchema } from '@handle-it/contracts';
import type { ApiClient } from '../../shared/http/api-client';

export interface SearchParameters {
  readonly query: string;
  readonly due: DueFilter | null;
  /** Jour local du visiteur, nécessaire au filtre d'échéance. */
  readonly today: string;
}

/** Recherche de cartes, dans tous les boards ou dans un seul. */
export class SearchGateway {
  constructor(private readonly apiClient: ApiClient) {}

  searchEverywhere(parameters: SearchParameters): Promise<SearchResponse> {
    return this.apiClient.get(`/search?${this.toQuery(parameters)}`, searchResponseSchema);
  }

  searchBoard(boardId: string, query: string): Promise<SearchResponse> {
    const search = new URLSearchParams({ q: query });
    return this.apiClient.get(`/boards/${boardId}/search?${search}`, searchResponseSchema);
  }

  private toQuery({ query, due, today }: SearchParameters): URLSearchParams {
    const search = new URLSearchParams({ q: query });
    if (due) {
      search.set('due', due);
      search.set('today', today);
    }
    return search;
  }
}
