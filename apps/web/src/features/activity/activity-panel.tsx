import { useId } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../../shared/ui/button';
import { Modal } from '../../shared/ui/modal';
import { ActivityList } from './activity-list';

/** Historique du board, ouvert par sa propre adresse. */
export function ActivityPanel() {
  const { boardId = '' } = useParams();
  const titleId = useId();
  const navigate = useNavigate();
  const close = () => void navigate(`/boards/${boardId}`);
  return (
    <Modal titleId={titleId} placement="side" close={close}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold">
            Activité
          </h2>
          <Button variant="secondary" onClick={close}>
            Fermer
          </Button>
        </div>
        <ActivityList
          boardId={boardId}
          cardId={null}
          emptyMessage="Aucune activité pour l'instant."
        />
      </div>
    </Modal>
  );
}
