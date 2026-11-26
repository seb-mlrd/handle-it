import type { LabelResponse } from '@handle-it/contracts';
import { useState } from 'react';
import { Button } from '../../shared/ui/button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { useDeleteLabel, useUpdateLabel } from '../board-view/use-board-content';
import { LabelChip } from './label-chip';
import { LABEL_COLOR_NAMES } from './label-colors';
import { LabelForm } from './label-form';

interface LabelItemProps {
  readonly boardId: string;
  readonly label: LabelResponse;
}

export function LabelItem({ boardId, label }: LabelItemProps) {
  const [openPanel, setOpenPanel] = useState<'edit' | 'delete' | null>(null);
  const close = () => setOpenPanel(null);
  const updateLabel = useUpdateLabel(boardId, label.id);
  const deleteLabel = useDeleteLabel(boardId, label.id);
  if (openPanel === 'edit') {
    return (
      <li className="py-3">
        <LabelForm
          label={label}
          submitLabel="Enregistrer"
          submit={(request) => updateLabel.mutateAsync(request).then(close)}
          close={close}
        />
      </li>
    );
  }
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex flex-col items-start gap-1">
        <LabelChip label={label} />
        <span className="text-sm text-muted">{LABEL_COLOR_NAMES[label.color]}</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          aria-label={`Modifier le label ${label.name}`}
          onClick={() => setOpenPanel('edit')}
        >
          Modifier
        </Button>
        <Button
          variant="secondary"
          aria-label={`Supprimer le label ${label.name}`}
          onClick={() => setOpenPanel('delete')}
        >
          Supprimer
        </Button>
      </div>
      {openPanel === 'delete' && (
        <ConfirmDialog
          title={`Supprimer le label « ${label.name} » ?`}
          consequence="Il sera retiré de toutes les cartes du tableau. Cette action est définitive."
          confirmLabel="Supprimer"
          error={deleteLabel.error}
          isPending={deleteLabel.isPending}
          confirm={() => deleteLabel.mutate(undefined, { onSuccess: close })}
          close={close}
        />
      )}
    </li>
  );
}
