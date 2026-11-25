import { LoadError } from '../../shared/ui/load-error';
import { MemberItem } from './member-item';
import { useMembers } from './use-members';

interface MemberListProps {
  readonly boardId: string;
  readonly canManage: boolean;
}

export function MemberList({ boardId, canManage }: MemberListProps) {
  const { data: members, error, isFetching, refetch } = useMembers(boardId);
  if (!members) {
    return error ? (
      <LoadError error={error} isRetrying={isFetching} retry={refetch} />
    ) : (
      <p role="status" className="text-muted">
        Chargement des membres…
      </p>
    );
  }
  return (
    <ul aria-label="Membres du tableau" className="flex flex-col divide-y divide-line">
      {members.map((member) => (
        <MemberItem
          key={member.userId}
          boardId={boardId}
          member={member}
          canRemove={canManage && member.role !== 'owner'}
        />
      ))}
    </ul>
  );
}
