import { Link, useLocation, useNavigate } from 'react-router';
import { ApiError, type ApiErrorCode } from '../../shared/http/api-error';
import { getErrorMessage } from '../../shared/http/error-message';
import { Button } from '../../shared/ui/button';
import { FormAlert } from '../../shared/ui/form-alert';
import { LoadError } from '../../shared/ui/load-error';
import { AppHeader } from '../layout/app-header';
import { readInvitationToken } from './invitation-link';
import { useAcceptInvitation, useInvitationPreview } from './use-invitation';

// Un lien tronqué est refusé comme mal formé : pour l'invité, c'est le même cas.
const INVALID_CODES: readonly ApiErrorCode[] = ['INVITATION_INVALID', 'INVALID_REQUEST'];

const isInvalidLink = (error: unknown) =>
  error instanceof ApiError && INVALID_CODES.includes(error.getCode());

export function InvitationPage() {
  const token = readInvitationToken(useLocation().hash);
  const navigate = useNavigate();
  const preview = useInvitationPreview(token);
  const acceptInvitation = useAcceptInvitation(token);
  const accept = () =>
    acceptInvitation.mutate(undefined, {
      onSuccess: (board) => void navigate(`/boards/${board.id}`, { replace: true }),
    });
  return (
    <>
      <title>Invitation · Handle It</title>
      <AppHeader />
      <main className="mx-auto flex max-w-xl flex-col items-start gap-6 px-6 py-10">
        {isInvalidLink(preview.error) || isInvalidLink(acceptInvitation.error) ? (
          <>
            <h1 className="text-display font-bold">Invitation non valable</h1>
            <p role="alert" className="text-muted">
              Ce lien a expiré ou a déjà servi. Demande un nouveau lien à la personne qui t'a
              invité.
            </p>
            <Link to="/" className="font-semibold underline">
              Mes tableaux
            </Link>
          </>
        ) : preview.data ? (
          <>
            <h1 className="text-display font-bold wrap-anywhere">
              Rejoindre « {preview.data.boardName} »
            </h1>
            <p className="text-muted">
              Tu pourras voir ce tableau, et gérer ses colonnes et ses cartes.
            </p>
            <FormAlert
              message={acceptInvitation.error && getErrorMessage(acceptInvitation.error)}
            />
            <Button disabled={acceptInvitation.isPending} onClick={accept}>
              {acceptInvitation.isPending ? 'Ouverture…' : 'Rejoindre le tableau'}
            </Button>
          </>
        ) : preview.error ? (
          <LoadError
            error={preview.error}
            isRetrying={preview.isFetching}
            retry={preview.refetch}
          />
        ) : (
          <p role="status" className="text-muted">
            Chargement de l'invitation…
          </p>
        )}
      </main>
    </>
  );
}
