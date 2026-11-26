import { useId } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../../shared/ui/button';
import { Modal } from '../../shared/ui/modal';
import { useLoadedBoard } from '../board-view/use-board-content';
import { InvitationSection } from './invitation-section';
import { LeaveBoard } from './leave-board';
import { MemberList } from './member-list';

/** Membres et invitations d'un board ; l'API reste seule juge des droits. */
export function MembersPanel() {
  const { boardId = '' } = useParams();
  const titleId = useId();
  const navigate = useNavigate();
  const { data: board } = useLoadedBoard(boardId, (loaded) => loaded);
  const isOwner = board?.role === 'owner';
  const close = () => void navigate(`/boards/${boardId}`);
  return (
    <Modal titleId={titleId} placement="side" close={close}>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold">
            Membres
          </h2>
          <Button variant="secondary" onClick={close}>
            Fermer
          </Button>
        </div>
        <MemberList boardId={boardId} canManage={isOwner} />
        {isOwner && <InvitationSection boardId={boardId} />}
        {board?.role === 'member' && <LeaveBoard boardId={boardId} boardName={board.name} />}
      </div>
    </Modal>
  );
}
