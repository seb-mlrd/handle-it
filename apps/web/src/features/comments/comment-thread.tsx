import { useId, useState } from 'react';
import { getErrorMessage } from '../../shared/http/error-message';
import { useNow } from '../../shared/time/use-now';
import { Button } from '../../shared/ui/button';
import { LoadError } from '../../shared/ui/load-error';
import { CommentComposer } from './comment-composer';
import { CommentEditForm } from './comment-edit-form';
import { CommentItem } from './comment-item';
import { useComments } from './use-comments';

interface CommentThreadProps {
  readonly boardId: string;
  readonly cardId: string;
}

interface Editing {
  readonly commentId: string;
  readonly draft: string;
}

/** Fil de commentaires d'une carte, saisie en bas. */
export function CommentThread({ boardId, cardId }: CommentThreadProps) {
  const titleId = useId();
  const now = useNow();
  const comments = useComments(boardId, cardId);
  // Gardé ici plutôt que dans le commentaire : sa suppression ailleurs ne fait pas perdre le texte.
  const [editing, setEditing] = useState<Editing | null>(null);
  const items = comments.data?.pages.flatMap((page) => page.items) ?? [];
  const isEditedCommentGone =
    editing !== null && comments.data && !items.some(({ id }) => id === editing.commentId);
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <h3 id={titleId} className="text-lg font-semibold">
        Commentaires
      </h3>
      {!comments.data ? (
        comments.error ? (
          <LoadError
            error={comments.error}
            isRetrying={comments.isFetching}
            retry={comments.refetch}
          />
        ) : (
          <p role="status" className="text-muted">
            Chargement des commentaires…
          </p>
        )
      ) : items.length === 0 ? (
        <p className="text-muted">Aucun commentaire pour l'instant.</p>
      ) : (
        <ol aria-label="Commentaires" className="flex flex-col divide-y divide-line">
          {items.map((comment) => (
            <li key={comment.id}>
              {editing?.commentId === comment.id ? (
                <CommentEditForm
                  boardId={boardId}
                  cardId={cardId}
                  commentId={comment.id}
                  draft={editing.draft}
                  changeDraft={(draft) => setEditing({ commentId: comment.id, draft })}
                  close={() => setEditing(null)}
                />
              ) : (
                <CommentItem
                  boardId={boardId}
                  cardId={cardId}
                  comment={comment}
                  now={now}
                  startEditing={() => setEditing({ commentId: comment.id, draft: comment.body })}
                />
              )}
            </li>
          ))}
        </ol>
      )}
      {comments.hasNextPage && (
        <div className="flex flex-col items-start gap-2">
          <Button
            variant="secondary"
            disabled={comments.isFetchingNextPage}
            onClick={() => void comments.fetchNextPage()}
          >
            {comments.isFetchingNextPage ? 'Chargement…' : 'Charger les commentaires suivants'}
          </Button>
          <span role="alert" className="text-sm text-danger">
            {comments.isFetchNextPageError && getErrorMessage(comments.error)}
          </span>
        </div>
      )}
      {isEditedCommentGone && (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p>Le commentaire que tu modifiais vient d'être supprimé. Ton texte :</p>
          <p className="whitespace-pre-wrap wrap-anywhere text-muted">{editing.draft}</p>
          <Button variant="secondary" onClick={() => setEditing(null)}>
            Fermer
          </Button>
        </div>
      )}
      <CommentComposer boardId={boardId} cardId={cardId} />
    </section>
  );
}
