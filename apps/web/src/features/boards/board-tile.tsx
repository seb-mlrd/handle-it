import { type BoardResponse, boardRequestSchema } from '@handle-it/contracts';
import { useState } from 'react';
import { Link } from 'react-router';
import { SingleFieldForm } from '../../shared/forms/single-field-form';
import { useReturnFocus } from '../../shared/focus/use-return-focus';
import { Button } from '../../shared/ui/button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { ROLE_LABELS } from './role-labels';
import { useDeleteBoard, useRenameBoard } from './use-boards';

interface BoardTileProps {
  readonly board: BoardResponse;
}

export function BoardTile({ board }: BoardTileProps) {
  const [openPanel, setOpenPanel] = useState<'rename' | 'delete' | null>(null);
  const close = () => setOpenPanel(null);
  const renameBoard = useRenameBoard(board.id);
  const deleteBoard = useDeleteBoard(board.id);
  const renameOpenerReference = useReturnFocus<HTMLButtonElement>(openPanel === 'rename');
  return (
    <li className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
      {openPanel === 'rename' ? (
        <SingleFieldForm
          schema={boardRequestSchema}
          label="Nom du tableau"
          fieldName="name"
          submitLabel="Enregistrer"
          defaultValue={board.name}
          submit={(request) => renameBoard.mutateAsync(request).then(close)}
          close={close}
        />
      ) : (
        <>
          <div className="grow">
            <h2 className="text-lg font-semibold wrap-anywhere">
              <Link to={`/boards/${board.id}`} className="hover:underline">
                {board.name}
              </Link>
            </h2>
            <p className="text-sm text-muted">{ROLE_LABELS[board.role]}</p>
          </div>
          {board.role === 'owner' && (
            <div className="flex flex-wrap gap-2">
              <Button
                ref={renameOpenerReference}
                variant="secondary"
                aria-label={`Renommer ${board.name}`}
                onClick={() => setOpenPanel('rename')}
              >
                Renommer
              </Button>
              <Button
                variant="secondary"
                aria-label={`Supprimer ${board.name}`}
                onClick={() => setOpenPanel('delete')}
              >
                Supprimer
              </Button>
            </div>
          )}
        </>
      )}
      {openPanel === 'delete' && (
        <ConfirmDialog
          title={`Supprimer « ${board.name} » ?`}
          consequence="Le tableau et tout son contenu seront supprimés pour tous ses membres. Cette action est définitive."
          confirmLabel="Supprimer"
          error={deleteBoard.error}
          isPending={deleteBoard.isPending}
          confirm={() => deleteBoard.mutate(undefined, { onSuccess: close })}
          close={close}
        />
      )}
    </li>
  );
}
