import { getErrorMessage } from '../../shared/http/error-message';
import { Button } from '../../shared/ui/button';
import { useCurrentUser } from './use-current-user';

interface SessionStatusProps {
  readonly retry: () => unknown;
}

/** Affiché tant que l'on ignore si l'utilisateur est connecté. */
export function SessionStatus({ retry }: SessionStatusProps) {
  const { error, isFetching } = useCurrentUser();
  if (!error) {
    return (
      <main className="p-6">
        <p role="status" className="text-muted">
          Chargement…
        </p>
      </main>
    );
  }
  return (
    <main className="flex flex-col items-start gap-4 p-6">
      <p role="alert">{getErrorMessage(error)}</p>
      <Button disabled={isFetching} onClick={() => void retry()}>
        Réessayer
      </Button>
    </main>
  );
}
