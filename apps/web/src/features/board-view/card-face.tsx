import type { CardViewResponse } from '@handle-it/contracts';
import { CommentCount } from '../comments/comment-count';
import { DueDateChip } from '../due-date/due-date-chip';
import { CardLabels } from '../labels/card-labels';

interface CardFaceProps {
  readonly boardId: string;
  readonly card: CardViewResponse;
}

/** Contenu visible d'une carte, partagé par la carte posée et la copie qui suit le pointeur. */
export function CardFace({ boardId, card }: CardFaceProps) {
  return (
    <>
      <span className="block">{card.title}</span>
      <CardLabels boardId={boardId} labelIds={card.labelIds} />
      {(card.dueOn || card.commentCount > 0) && (
        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {card.dueOn && <DueDateChip dueOn={card.dueOn} />}
          <CommentCount count={card.commentCount} />
        </span>
      )}
    </>
  );
}
