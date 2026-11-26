import type { SearchResponse } from '@handle-it/contracts';
import type { SearchResult } from './search-result.js';

export function presentSearchResults(results: readonly SearchResult[]): SearchResponse {
  return {
    results: results.map(({ excerpt, ...result }) => ({
      ...result,
      excerpt: [...excerpt.getSegments()],
    })),
  };
}
