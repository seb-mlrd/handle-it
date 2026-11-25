import { LoadError } from '../../shared/ui/load-error';
import { BoardTile } from './board-tile';
import { useBoards } from './use-boards';

export function BoardList() {
  const { data: boards, error, isFetching, refetch } = useBoards();
  if (!boards && error) {
    return <LoadError error={error} isRetrying={isFetching} retry={refetch} />;
  }
  if (!boards) {
    return (
      <p role="status" className="text-muted">
        Chargement des tableaux…
      </p>
    );
  }
  if (boards.length === 0) {
    return <p className="text-muted">Aucun tableau pour l'instant. Crée le premier ci-dessus.</p>;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <BoardTile key={board.id} board={board} />
      ))}
    </ul>
  );
}
