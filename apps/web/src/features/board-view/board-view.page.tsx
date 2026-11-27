import { Link, useParams } from 'react-router';
import { ApiError, type ApiErrorCode } from '../../shared/http/api-error';
import { LoadError } from '../../shared/ui/load-error';
import { AppHeader } from '../layout/app-header';
import { BoardContent } from './board-content';
import { useBoardView } from './use-board-content';
import { MAIN_CONTENT_ID } from '../layout/skip-link';

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
      <AppHeader currentPage={isMissing ? undefined : board?.name} />
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="outline-none flex min-h-0 grow flex-col gap-5 pt-6"
      >
        {isMissing ? (
          <div className="flex flex-col gap-2 px-6">
            <h1 className="text-display font-bold">Tableau introuvable</h1>
            <p role="alert" className="text-muted">
              Ce tableau n'existe pas, ou tu n'y as pas accès.
            </p>
            <Link to="/" className="self-start font-semibold underline">
              Retour à mes tableaux
            </Link>
          </div>
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
