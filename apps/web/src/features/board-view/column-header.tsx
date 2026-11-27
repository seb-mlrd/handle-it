import { type ColumnViewResponse, columnRequestSchema } from '@handle-it/contracts';
import { type ReactNode, useState } from 'react';
import { SingleFieldForm } from '../../shared/forms/single-field-form';
import { useReturnFocus } from '../../shared/focus/use-return-focus';
import { ActionMenu } from '../../shared/ui/action-menu';
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
  const menuTriggerReference = useReturnFocus<HTMLButtonElement>(openPanel === 'rename');
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
      <div className="flex items-start gap-1">
        <h2 className="min-w-0 grow px-2 py-2.5 text-headline font-semibold wrap-anywhere">
          {column.name}
        </h2>
        {/* Décoratif : la liste des cartes annonce déjà son nombre d'éléments. */}
        <span
          aria-hidden="true"
          className="mt-2.5 rounded-full bg-ink/6 px-2 text-sm leading-6 font-medium text-muted tabular-nums"
        >
          {column.cards.length}
        </span>
        <ActionMenu
          label={`Actions de la colonne ${column.name}`}
          triggerReference={menuTriggerReference}
          items={[
            {
              label: 'Renommer',
              accessibleName: `Renommer la colonne ${column.name}`,
              select: () => setOpenPanel('rename'),
            },
            {
              label: 'Supprimer',
              accessibleName: `Supprimer la colonne ${column.name}`,
              isDestructive: true,
              select: () => setOpenPanel('delete'),
            },
          ]}
        />
        {handle}
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
