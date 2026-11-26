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
  type LabelRequest,
  type LabelResponse,
  labelResponseSchema,
  type MoveCardRequest,
  type MoveColumnRequest,
  type SetDueDateRequest,
  type UpdateCardRequest,
} from '@handle-it/contracts';
import { z } from 'zod';
import type { ApiClient } from '../../shared/http/api-client';

const labelIdsSchema = z.array(z.uuid());

/** Accès au contenu d'un board : colonnes, cartes et labels. */
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

  createLabel(boardId: string, request: LabelRequest): Promise<LabelResponse> {
    return this.apiClient.post(`/boards/${boardId}/labels`, request, labelResponseSchema);
  }

  updateLabel(boardId: string, labelId: string, request: LabelRequest): Promise<LabelResponse> {
    const path = `/boards/${boardId}/labels/${labelId}`;
    return this.apiClient.patch(path, request, labelResponseSchema);
  }

  deleteLabel(boardId: string, labelId: string): Promise<void> {
    return this.apiClient.delete(`/boards/${boardId}/labels/${labelId}`);
  }

  setDueDate(boardId: string, cardId: string, request: SetDueDateRequest): Promise<CardResponse> {
    const path = `/boards/${boardId}/cards/${cardId}/due-date`;
    return this.apiClient.putWithBody(path, request, cardResponseSchema);
  }

  /** Pose ou retire un label ; renvoie les labels de la carte. */
  async setCardLabel(
    boardId: string,
    cardId: string,
    labelId: string,
    isAttached: boolean,
  ): Promise<string[]> {
    const path = `/boards/${boardId}/cards/${cardId}/labels/${labelId}`;
    return isAttached
      ? this.apiClient.put(path, labelIdsSchema)
      : this.apiClient.deleteWithResult(path, labelIdsSchema);
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
