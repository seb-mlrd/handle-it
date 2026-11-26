import { Link, useParams } from 'react-router';
import { ApiError, type ApiErrorCode } from '../../shared/http/api-error';
import { LoadError } from '../../shared/ui/load-error';
import { AppHeader } from '../layout/app-header';
import { BoardContent } from './board-content';
import { useBoardView } from './use-board-content';

// Une adresse mal formée est refusée comme invalide : pour l'utilisateur, c'est le même cas.
const MISSING_CODES: readonly ApiErrorCode[] = ['NOT_FOUND', 'INVALID_REQUEST'];

export function BoardViewPage() {
  const { boardId = '' } = useParams();
  const { data: board, error, isFetching, refetch } = useBoardView(boardId);
  // Un accès perdu masque aussi le contenu déjà chargé.
  const isMissing = error instanceof ApiError && MISSING_CODES.includes(error.getCode());
  return (
    <div className="flex h-dvh flex-col">
      <title>{`${(!isMissing && board?.name) || 'Tableau'} · Handle It`}</title>
      <AppHeader />
      <main className="flex min-h-0 grow flex-col gap-4 py-6">
        <Link to="/" className="mx-6 self-start text-muted underline">
          Mes tableaux
        </Link>
        {isMissing ? (
          <p role="alert" className="px-6">
            Ce tableau n'existe pas, ou tu n'y as pas accès.
          </p>
        ) : board ? (
          <BoardContent board={board} />
        ) : error ? (
          <div className="px-6">
            <LoadError error={error} isRetrying={isFetching} retry={refetch} />
          </div>
        ) : (
          <p role="status" className="px-6 text-muted">
            Chargement du tableau…
          </p>
        )}
      </main>
    </div>
  );
}
