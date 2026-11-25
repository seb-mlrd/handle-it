import type { MemberResponse } from '@handle-it/contracts';
import { useState } from 'react';
import { Button } from '../../shared/ui/button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { useCurrentUser } from '../auth/use-current-user';
import { ROLE_LABELS } from '../boards/role-labels';
import { useRemoveMember } from './use-members';

interface MemberItemProps {
  readonly boardId: string;
  readonly member: MemberResponse;
  readonly canRemove: boolean;
}

export function MemberItem({ boardId, member, canRemove }: MemberItemProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const removeMember = useRemoveMember(boardId, member.userId);
  const close = () => setIsConfirming(false);
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="font-semibold wrap-anywhere">
          {member.displayName}
          {member.userId === currentUser?.id && ' (toi)'}
        </p>
        <p className="text-sm text-muted">{ROLE_LABELS[member.role]}</p>
      </div>
      {canRemove && (
        <Button
          variant="secondary"
          aria-label={`Retirer ${member.displayName}`}
          onClick={() => setIsConfirming(true)}
        >
          Retirer
        </Button>
      )}
      {isConfirming && (
        <ConfirmDialog
          title={`Retirer ${member.displayName} ?`}
          consequence="Cette personne perdra l'accès au tableau. Tous les liens d'invitation en cours seront annulés, pour qu'elle ne puisse pas revenir."
          confirmLabel="Retirer"
          error={removeMember.error}
          isPending={removeMember.isPending}
          confirm={() => removeMember.mutate(undefined, { onSuccess: close })}
          close={close}
        />
      )}
    </li>
  );
}
