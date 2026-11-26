import type { CommentPageResponse, CommentResponse } from '@handle-it/contracts';
import type { ReadableComment, ReadableCommentPage } from './readable-comment.js';

export function presentComment({ comment, canEdit, canDelete }: ReadableComment): CommentResponse {
  return {
    id: comment.getId(),
    authorName: comment.getAuthorName(),
    body: comment.getBody(),
    createdAt: comment.getCreatedAt().toISOString(),
    updatedAt: comment.getUpdatedAt()?.toISOString() ?? null,
    canEdit,
    canDelete,
  };
}

export function presentCommentPage(page: ReadableCommentPage): CommentPageResponse {
  return { items: page.items.map(presentComment), nextCursor: page.nextCursor };
}
