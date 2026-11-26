import {
  type CommentPageResponse,
  commentPageResponseSchema,
  type CommentRequest,
  type CommentResponse,
  commentResponseSchema,
} from '@handle-it/contracts';
import type { ApiClient } from '../../shared/http/api-client';

/** Accès aux commentaires des cartes d'un board. */
export class CommentGateway {
  constructor(private readonly apiClient: ApiClient) {}

  /** Une page du fil, du plus ancien au plus récent ; `after` vient de la page précédente. */
  list(boardId: string, cardId: string, after: string | null): Promise<CommentPageResponse> {
    const query = after ? `?${new URLSearchParams({ after })}` : '';
    const path = `/boards/${boardId}/cards/${cardId}/comments${query}`;
    return this.apiClient.get(path, commentPageResponseSchema);
  }

  add(boardId: string, cardId: string, request: CommentRequest): Promise<CommentResponse> {
    const path = `/boards/${boardId}/cards/${cardId}/comments`;
    return this.apiClient.post(path, request, commentResponseSchema);
  }

  update(boardId: string, commentId: string, request: CommentRequest): Promise<CommentResponse> {
    const path = `/boards/${boardId}/comments/${commentId}`;
    return this.apiClient.patch(path, request, commentResponseSchema);
  }

  delete(boardId: string, commentId: string): Promise<void> {
    return this.apiClient.delete(`/boards/${boardId}/comments/${commentId}`);
  }
}
