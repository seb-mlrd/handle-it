import type { SearchRequest } from '@handle-it/contracts';
import type { BoardAccessService } from '../board/board-access.service.js';
import { DueDate } from '../card/due-date.value-object.js';
import { DueWindow } from './due-window.value-object.js';
import { SearchQuery } from './search-query.value-object.js';
import type { SearchRepository } from './search.repository.js';
import type { SearchResult } from './search-result.js';

const MAX_RESULTS = 50;
/** Le filtre du board s'appuie sur ces résultats : la limite dépasse ce qu'un board réel contient. */
const MAX_BOARD_RESULTS = 500;

/** Recherche de cartes dans les boards de l'utilisateur. */
export class SearchService {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly boardAccessService: BoardAccessService,
  ) {}

  /** Cherche dans tous les boards de l'utilisateur ; les labels, propres à un board, n'y filtrent pas. */
  searchEverywhere(userId: string, request: SearchRequest): Promise<SearchResult[]> {
    return this.search(userId, null, { ...request, labelIds: [] }, MAX_RESULTS);
  }

  /** Cherche dans un board dont l'utilisateur doit être membre. */
  async searchBoard(
    userId: string,
    boardId: string,
    request: SearchRequest,
  ): Promise<SearchResult[]> {
    await this.boardAccessService.authorize(userId, boardId, 'view-board');
    return this.search(userId, boardId, request, MAX_BOARD_RESULTS);
  }

  private search(
    userId: string,
    boardId: string | null,
    request: SearchRequest,
    limit: number,
  ): Promise<SearchResult[]> {
    const due =
      request.due && request.today
        ? DueWindow.from(request.due, DueDate.fromValue(request.today))
        : null;
    return this.searchRepository.search({
      userId,
      boardId,
      query: SearchQuery.fromText(request.q),
      due,
      labelIds: request.labelIds ?? [],
      limit,
    });
  }
}
