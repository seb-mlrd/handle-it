import { LoadError } from '../../shared/ui/load-error';
import { createInvitationLink } from '../invitation/invitation-link';
import { CreateInvitationForm } from './create-invitation-form';
import { InvitationLinkField } from './invitation-link-field';
import { formatRemainingTime } from './remaining-time';
import { useCreateInvitation, useInvitations } from './use-members';
import { useNow } from '../../shared/time/use-now';

interface InvitationSectionProps {
  readonly boardId: string;
}

export function InvitationSection({ boardId }: InvitationSectionProps) {
  const now = useNow();
  const invitations = useInvitations(boardId);
  const createInvitation = useCreateInvitation(boardId);
  const created = createInvitation.data;
  const activeInvitations = (invitations.data ?? []).flatMap(({ id, expiresAt }) => {
    const remainingTime = formatRemainingTime(expiresAt, now);
    return remainingTime ? [{ id, remainingTime }] : [];
  });
  // Un lien expiré ou déjà utilisé ne doit plus être proposé à la copie.
  const isCreatedActive = activeInvitations.some(({ id }) => id === created?.id);
  return (
    <section aria-label="Invitations" className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Inviter quelqu'un</h3>
      <p className="text-muted">Un lien sert à une seule personne.</p>
      <CreateInvitationForm submit={createInvitation.mutateAsync} />
      {created && isCreatedActive && (
        <InvitationLinkField
          key={created.id}
          link={createInvitationLink(window.location.origin, created.token)}
        />
      )}
      {!invitations.data && invitations.error && (
        <LoadError
          error={invitations.error}
          isRetrying={invitations.isFetching}
          retry={invitations.refetch}
        />
      )}
      {activeInvitations.length > 0 && (
        <ul aria-label="Liens en cours" className="flex flex-col divide-y divide-line">
          {activeInvitations.map(({ id, remainingTime }) => (
            <li key={id} className="py-3">
              Lien actif encore {remainingTime}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
