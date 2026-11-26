import { type SearchRequest, searchRequestSchema, type SearchResponse } from '@handle-it/contracts';
import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { UserThrottlerGuard } from '../shared/http/user-throttler.guard.js';
import { uuidPipe } from '../shared/http/uuid.pipe.js';
import { ZodValidationPipe } from '../shared/http/zod-validation.pipe.js';
import type { User } from '../user/user.entity.js';
import { presentSearchResults } from './search.presenter.js';
import { SearchService } from './search.service.js';

/** Assez pour une frappe rapide avec pause, pas pour aspirer la base en boucle. */
export const SEARCH_REQUESTS_LIMIT = 30;
const SEARCH_WINDOW_MILLISECONDS = 10_000;

const searchRequestPipe = new ZodValidationPipe(searchRequestSchema);

@Controller()
@UseGuards(UserThrottlerGuard)
@Throttle({ default: { limit: SEARCH_REQUESTS_LIMIT, ttl: SEARCH_WINDOW_MILLISECONDS } })
export class SearchController {
  constructor(@Inject(SearchService) private readonly searchService: SearchService) {}

  /** Cherche dans tous les boards de l'utilisateur. */
  @Get('search')
  async searchEverywhere(
    @CurrentUser() user: User,
    @Query(searchRequestPipe) request: SearchRequest,
  ): Promise<SearchResponse> {
    return presentSearchResults(await this.searchService.searchEverywhere(user.getId(), request));
  }

  /** Cherche dans un seul board. */
  @Get('boards/:boardId/search')
  async searchBoard(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Query(searchRequestPipe) request: SearchRequest,
  ): Promise<SearchResponse> {
    const results = await this.searchService.searchBoard(user.getId(), boardId, request);
    return presentSearchResults(results);
  }
}
