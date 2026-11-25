import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../shared/ui/button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { useLeaveBoard } from './use-members';

interface LeaveBoardProps {
  readonly boardId: string;
  readonly boardName: string;
}

export function LeaveBoard({ boardId, boardName }: LeaveBoardProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const navigate = useNavigate();
  const leaveBoard = useLeaveBoard(boardId, () => navigate('/'));
  return (
    <div>
      <Button variant="secondary" onClick={() => setIsConfirming(true)}>
        Quitter le tableau
      </Button>
      {isConfirming && (
        <ConfirmDialog
          title={`Quitter « ${boardName} » ?`}
          consequence="Tu n'auras plus accès à ce tableau. Il faudra une nouvelle invitation pour y revenir."
          confirmLabel="Quitter"
          error={leaveBoard.error}
          isPending={leaveBoard.isPending}
          confirm={() => leaveBoard.mutate()}
          close={() => setIsConfirming(false)}
        />
      )}
    </div>
  );
}
