import {
  boardListResponseSchema,
  type BoardRequest,
  type BoardResponse,
  boardResponseSchema,
} from '@handle-it/contracts';
import type { ApiClient } from '../../shared/http/api-client';

/** Accès aux routes des boards. */
export class BoardGateway {
  constructor(private readonly apiClient: ApiClient) {}

  list(): Promise<BoardResponse[]> {
    return this.apiClient.get('/boards', boardListResponseSchema);
  }

  create(request: BoardRequest): Promise<BoardResponse> {
    return this.apiClient.post('/boards', request, boardResponseSchema);
  }

  rename(boardId: string, request: BoardRequest): Promise<BoardResponse> {
    return this.apiClient.patch(`/boards/${boardId}`, request, boardResponseSchema);
  }

  delete(boardId: string): Promise<void> {
    return this.apiClient.delete(`/boards/${boardId}`);
  }
}
