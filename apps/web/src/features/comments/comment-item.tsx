import type { CommentResponse } from '@handle-it/contracts';
import { useState } from 'react';
import { formatFullDate, formatRelativeTime } from '../../shared/time/relative-time';
import { Button } from '../../shared/ui/button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { FORMER_MEMBER_NAME } from '../activity/activity-sentence';
import { useDeleteComment } from './use-comments';

interface CommentItemProps {
  readonly boardId: string;
  readonly cardId: string;
  readonly comment: CommentResponse;
  readonly now: number;
  readonly startEditing: () => void;
}

/** Un commentaire du fil, avec les actions que l'API autorise. */
export function CommentItem({ boardId, cardId, comment, now, startEditing }: CommentItemProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const deleteComment = useDeleteComment(boardId, cardId, comment.id);
  const authorName = comment.authorName ?? FORMER_MEMBER_NAME;
  return (
    <article aria-label={`Commentaire de ${authorName}`} className="flex flex-col gap-1 py-3">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-semibold wrap-anywhere">{authorName}</span>
        <time
          dateTime={comment.createdAt}
          title={formatFullDate(comment.createdAt)}
          className="text-sm text-muted"
        >
          {formatRelativeTime(comment.createdAt, now)}
        </time>
        {comment.updatedAt && (
          <span className="text-sm text-muted" title={formatFullDate(comment.updatedAt)}>
            (modifié)
          </span>
        )}
      </p>
      <p className="whitespace-pre-wrap wrap-anywhere">{comment.body}</p>
      {(comment.canEdit || comment.canDelete) && (
        <div className="flex gap-1">
          {comment.canEdit && (
            <Button
              variant="ghost"
              aria-label={`Modifier le commentaire de ${authorName}`}
              onClick={startEditing}
            >
              Modifier
            </Button>
          )}
          {comment.canDelete && (
            <Button
              variant="ghost"
              aria-label={`Supprimer le commentaire de ${authorName}`}
              onClick={() => setIsConfirmingDelete(true)}
            >
              Supprimer
            </Button>
          )}
        </div>
      )}
      {isConfirmingDelete && (
        <ConfirmDialog
          title={`Supprimer le commentaire de ${authorName} ?`}
          consequence="Cette action est définitive."
          confirmLabel="Supprimer"
          error={deleteComment.error}
          isPending={deleteComment.isPending}
          confirm={() =>
            deleteComment.mutate(undefined, { onSuccess: () => setIsConfirmingDelete(false) })
          }
          close={() => setIsConfirmingDelete(false)}
        />
      )}
    </article>
  );
}
