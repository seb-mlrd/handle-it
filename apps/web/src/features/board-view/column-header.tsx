import { type ColumnViewResponse, columnRequestSchema } from '@handle-it/contracts';
import { useState } from 'react';
import { SingleFieldForm } from '../../shared/forms/single-field-form';
import { Button } from '../../shared/ui/button';
import { ConfirmDeleteDialog } from '../../shared/ui/confirm-delete-dialog';
import { useDeleteColumn, useRenameColumn } from './use-board-content';

interface ColumnHeaderProps {
  readonly boardId: string;
  readonly column: ColumnViewResponse;
}

export function ColumnHeader({ boardId, column }: ColumnHeaderProps) {
  const [openPanel, setOpenPanel] = useState<'rename' | 'delete' | null>(null);
  const close = () => setOpenPanel(null);
  const renameColumn = useRenameColumn(boardId, column.id);
  const deleteColumn = useDeleteColumn(boardId, column.id);
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
      <h2 className="px-1 text-lg font-semibold wrap-anywhere">{column.name}</h2>
      <div className="flex">
        <Button
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
        <ConfirmDeleteDialog
          title={`Supprimer « ${column.name} » ?`}
          consequence="La colonne et toutes ses cartes seront supprimées. Cette action est définitive."
          error={deleteColumn.error}
          isPending={deleteColumn.isPending}
          confirm={() => deleteColumn.mutate(undefined, { onSuccess: close })}
          close={close}
        />
      )}
    </div>
  );
}
