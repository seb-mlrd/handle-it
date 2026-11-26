import type { SearchMatch } from '@handle-it/contracts';
import type { Excerpt } from './excerpt.js';

/** Carte trouvée, avec l'endroit où le mot l'a été. */
export interface SearchResult {
  readonly cardId: string;
  readonly cardTitle: string;
  readonly boardId: string;
  readonly boardName: string;
  readonly columnName: string;
  readonly matchedIn: SearchMatch;
  readonly excerpt: Excerpt;
}
