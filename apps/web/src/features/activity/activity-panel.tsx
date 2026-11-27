import { useId } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Modal } from '../../shared/ui/modal';
import { SheetHeader } from '../../shared/ui/sheet-header';
import { ActivityList } from './activity-list';

/** Historique du board, ouvert par sa propre adresse. */
export function ActivityPanel() {
  const { boardId = '' } = useParams();
  const titleId = useId();
  const navigate = useNavigate();
  const close = () => void navigate(`/boards/${boardId}`);
  return (
    <Modal titleId={titleId} placement="side" close={close}>
      <SheetHeader titleId={titleId} title="Activité" close={close} />
      <div className="flex flex-col gap-6">
        <ActivityList
          boardId={boardId}
          cardId={null}
          emptyMessage="Aucune activité pour l'instant."
        />
      </div>
    </Modal>
  );
}
