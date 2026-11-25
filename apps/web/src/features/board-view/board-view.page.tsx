import { Link, Outlet, useParams } from 'react-router';
import { ApiError, type ApiErrorCode } from '../../shared/http/api-error';
import { LoadError } from '../../shared/ui/load-error';
import { AppHeader } from '../layout/app-header';
import { BoardColumns } from './board-columns';
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
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 px-6">
              <h1 className="text-display font-bold wrap-anywhere">{board.name}</h1>
              <Link
                to={`/boards/${board.id}/members`}
                className="flex h-11 items-center rounded-control border border-control bg-surface px-4 font-semibold hover:bg-canvas"
              >
                Membres
              </Link>
            </div>
            <BoardColumns boardId={board.id} />
            <Outlet />
          </>
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
