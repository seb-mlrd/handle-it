import { useId, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '../../shared/http/api-error';
import { Button } from '../../shared/ui/button';
import { LoadError } from '../../shared/ui/load-error';
import { Modal } from '../../shared/ui/modal';
import { DueDateField } from '../due-date/due-date-field';
import { LabelPicker } from '../labels/label-picker';
import { ActivityList } from '../activity/activity-list';
import { CommentThread } from '../comments/comment-thread';
import { CardForm } from './card-form';
import { useCard } from './use-board-content';

/** Détail d'une carte, ouvert par-dessus son board et accessible par sa propre adresse. */
export function CardPanel() {
  const { boardId = '', cardId = '' } = useParams();
  const titleId = useId();
  const activityTitleId = useId();
  const navigate = useNavigate();
  const [isDirty, setIsDirty] = useState(false);
  const { data: card, error, isFetching, refetch } = useCard(boardId, cardId);
  const isDeleted = error instanceof ApiError && error.getCode() === 'NOT_FOUND';
  const close = () => void navigate(`/boards/${boardId}`);
  return (
    <Modal titleId={titleId} placement="side" isEscapeBlocked={isDirty} close={close}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-xl font-bold">
          Détail de la carte
        </h2>
        <Button variant="secondary" onClick={close}>
          {isDirty ? 'Fermer sans enregistrer' : 'Fermer'}
        </Button>
      </div>
      {isDeleted ? (
        <p role="alert">Cette carte a été supprimée.</p>
      ) : card ? (
        <>
          <CardForm
            boardId={boardId}
            card={card}
            markAsDirty={() => setIsDirty(true)}
            close={close}
          />
          <div className="mt-10">
            <LabelPicker boardId={boardId} cardId={cardId} />
          </div>
          <div className="mt-10">
            <DueDateField key={card.dueOn} boardId={boardId} cardId={cardId} dueOn={card.dueOn} />
          </div>
          <div className="mt-10">
            <CommentThread boardId={boardId} cardId={cardId} />
          </div>
          <section aria-labelledby={activityTitleId} className="mt-10 flex flex-col gap-4">
            <h3 id={activityTitleId} className="text-lg font-semibold">
              Activité
            </h3>
            <ActivityList
              boardId={boardId}
              cardId={cardId}
              emptyMessage="Aucune activité sur cette carte."
            />
          </section>
        </>
      ) : error ? (
        <LoadError error={error} isRetrying={isFetching} retry={refetch} />
      ) : (
        <p role="status" className="text-muted">
          Chargement de la carte…
        </p>
      )}
    </Modal>
  );
}
