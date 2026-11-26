import {
  type ActivityPageResponse,
  activityPageResponseSchema,
  type BoardViewResponse,
  boardViewResponseSchema,
  type CardResponse,
  cardResponseSchema,
  type ColumnRequest,
  type ColumnResponse,
  columnResponseSchema,
  type CreateCardRequest,
  type MoveCardRequest,
  type MoveColumnRequest,
  type UpdateCardRequest,
} from '@handle-it/contracts';
import type { ApiClient } from '../../shared/http/api-client';

/** Accès au contenu d'un board : colonnes et cartes. */
export class BoardContentGateway {
  constructor(private readonly apiClient: ApiClient) {}

  getBoard(boardId: string): Promise<BoardViewResponse> {
    return this.apiClient.get(`/boards/${boardId}`, boardViewResponseSchema);
  }

  /** Une page d'historique ; `before` vient de la page précédente. */
  listActivities(
    boardId: string,
    cardId: string | null,
    before: string | null,
  ): Promise<ActivityPageResponse> {
    const scope = cardId ? `/cards/${cardId}/activities` : '/activities';
    const query = before ? `?${new URLSearchParams({ before })}` : '';
    return this.apiClient.get(`/boards/${boardId}${scope}${query}`, activityPageResponseSchema);
  }

  createColumn(boardId: string, request: ColumnRequest): Promise<ColumnResponse> {
    return this.apiClient.post(`/boards/${boardId}/columns`, request, columnResponseSchema);
  }

  renameColumn(boardId: string, columnId: string, request: ColumnRequest): Promise<ColumnResponse> {
    const path = `/boards/${boardId}/columns/${columnId}`;
    return this.apiClient.patch(path, request, columnResponseSchema);
  }

  deleteColumn(boardId: string, columnId: string): Promise<void> {
    return this.apiClient.delete(`/boards/${boardId}/columns/${columnId}`);
  }

  moveColumn(boardId: string, columnId: string, request: MoveColumnRequest): Promise<void> {
    const path = `/boards/${boardId}/columns/${columnId}/position`;
    return this.apiClient.patchWithoutResult(path, request);
  }

  createCard(boardId: string, columnId: string, request: CreateCardRequest): Promise<CardResponse> {
    const path = `/boards/${boardId}/columns/${columnId}/cards`;
    return this.apiClient.post(path, request, cardResponseSchema);
  }

  getCard(boardId: string, cardId: string): Promise<CardResponse> {
    return this.apiClient.get(`/boards/${boardId}/cards/${cardId}`, cardResponseSchema);
  }

  updateCard(boardId: string, cardId: string, request: UpdateCardRequest): Promise<CardResponse> {
    const path = `/boards/${boardId}/cards/${cardId}`;
    return this.apiClient.patch(path, request, cardResponseSchema);
  }

  moveCard(boardId: string, cardId: string, request: MoveCardRequest): Promise<void> {
    const path = `/boards/${boardId}/cards/${cardId}/position`;
    return this.apiClient.patchWithoutResult(path, request);
  }

  deleteCard(boardId: string, cardId: string): Promise<void> {
    return this.apiClient.delete(`/boards/${boardId}/cards/${cardId}`);
  }
}
