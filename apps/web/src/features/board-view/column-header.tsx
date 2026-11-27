import { type ColumnViewResponse, columnRequestSchema } from '@handle-it/contracts';
import { type ReactNode, useState } from 'react';
import { SingleFieldForm } from '../../shared/forms/single-field-form';
import { useReturnFocus } from '../../shared/focus/use-return-focus';
import { Button } from '../../shared/ui/button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { useDeleteColumn, useRenameColumn } from './use-board-content';

interface ColumnHeaderProps {
  readonly boardId: string;
  readonly column: ColumnViewResponse;
  readonly handle: ReactNode;
}

export function ColumnHeader({ boardId, column, handle }: ColumnHeaderProps) {
  const [openPanel, setOpenPanel] = useState<'rename' | 'delete' | null>(null);
  const close = () => setOpenPanel(null);
  const renameColumn = useRenameColumn(boardId, column.id);
  const deleteColumn = useDeleteColumn(boardId, column.id);
  const renameOpenerReference = useReturnFocus<HTMLButtonElement>(openPanel === 'rename');
  if (openPanel === 'rename') {
    return (
      <SingleFieldForm
        schema={columnRequestSchema}
        label="Nom de la colonne"
        fieldName="name"
        submitLabel="Enregistrer"
        defaultValue={column.name}
        submit={(request) => renameColumn.mutateAsync(request).then(close)}
        close={close}
      />
    );
  }
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <h2 className="px-1 py-2 text-lg font-semibold wrap-anywhere">{column.name}</h2>
        {handle}
      </div>
      <div className="flex">
        <Button
          ref={renameOpenerReference}
          variant="ghost"
          aria-label={`Renommer la colonne ${column.name}`}
          onClick={() => setOpenPanel('rename')}
        >
          Renommer
        </Button>
        <Button
          variant="ghost"
          aria-label={`Supprimer la colonne ${column.name}`}
          onClick={() => setOpenPanel('delete')}
        >
          Supprimer
        </Button>
      </div>
      {openPanel === 'delete' && (
        <ConfirmDialog
          title={`Supprimer « ${column.name} » ?`}
          consequence="La colonne et toutes ses cartes seront supprimées. Cette action est définitive."
          confirmLabel="Supprimer"
          error={deleteColumn.error}
          isPending={deleteColumn.isPending}
          confirm={() => deleteColumn.mutate(undefined, { onSuccess: close })}
          close={close}
        />
      )}
    </div>
  );
}
