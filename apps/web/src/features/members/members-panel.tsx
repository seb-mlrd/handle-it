import { useId } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Modal } from '../../shared/ui/modal';
import { SheetHeader } from '../../shared/ui/sheet-header';
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
      <SheetHeader titleId={titleId} title="Membres" close={close} />
      <div className="flex flex-col gap-8">
        <MemberList boardId={boardId} canManage={isOwner} />
        {isOwner && <InvitationSection boardId={boardId} />}
        {board?.role === 'member' && <LeaveBoard boardId={boardId} boardName={board.name} />}
      </div>
    </Modal>
  );
}
