import { type BoardResponse, boardRequestSchema } from '@handle-it/contracts';
import { useState } from 'react';
import { Link } from 'react-router';
import { SingleFieldForm } from '../../shared/forms/single-field-form';
import { useReturnFocus } from '../../shared/focus/use-return-focus';
import { ActionMenu } from '../../shared/ui/action-menu';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { BoardMonogram } from './board-monogram';
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
  const menuTriggerReference = useReturnFocus<HTMLButtonElement>(openPanel === 'rename');
  return (
    <li className="relative flex min-h-36 flex-col gap-4 rounded-card bg-surface p-4 shadow-raised transition-[box-shadow,translate] has-[a:hover]:shadow-lifted motion-safe:has-[a:hover]:-translate-y-0.5 motion-reduce:transition-none">
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
          <div className="flex items-start justify-between gap-2">
            <BoardMonogram boardId={board.id} name={board.name} />
            {board.role === 'owner' && (
              // Au-dessus du lien qui couvre la tuile, pour rester cliquable.
              <div className="relative z-10 -mt-1.5 -mr-1.5">
                <ActionMenu
                  label={`Actions de ${board.name}`}
                  triggerReference={menuTriggerReference}
                  items={[
                    {
                      label: 'Renommer',
                      accessibleName: `Renommer ${board.name}`,
                      select: () => setOpenPanel('rename'),
                    },
                    {
                      label: 'Supprimer',
                      accessibleName: `Supprimer ${board.name}`,
                      isDestructive: true,
                      select: () => setOpenPanel('delete'),
                    },
                  ]}
                />
              </div>
            )}
          </div>
          <div className="mt-auto">
            <h2 className="text-headline font-semibold wrap-anywhere">
              {/* Le lien couvre toute la tuile : elle se clique partout, sans lien imbriqué. */}
              <Link
                to={`/boards/${board.id}`}
                className="rounded-card after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ink"
              >
                {board.name}
              </Link>
            </h2>
            <p className="text-sm text-muted">{ROLE_LABELS[board.role]}</p>
          </div>
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
