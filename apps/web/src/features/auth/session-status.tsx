import { LoadError } from '../../shared/ui/load-error';
import { useCurrentUser } from './use-current-user';
import { MAIN_CONTENT_ID } from '../layout/skip-link';

interface SessionStatusProps {
  readonly retry: () => unknown;
}

/** Affiché tant que l'on ignore si l'utilisateur est connecté. */
export function SessionStatus({ retry }: SessionStatusProps) {
  const { error, isFetching } = useCurrentUser();
  if (!error) {
    return (
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none p-6">
        <p role="status" className="text-muted">
          Chargement…
        </p>
      </main>
    );
  }
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none p-6">
      <LoadError error={error} isRetrying={isFetching} retry={retry} />
    </main>
  );
}
