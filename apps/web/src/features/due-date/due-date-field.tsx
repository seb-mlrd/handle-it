import { useState } from 'react';
import { getErrorMessage } from '../../shared/http/error-message';
import { Button } from '../../shared/ui/button';
import { TextField } from '../../shared/ui/text-field';
import { useSetDueDate } from '../board-view/use-board-content';
import { formatDueDate } from './due-date-status';

interface DueDateFieldProps {
  readonly boardId: string;
  readonly cardId: string;
  readonly dueOn: string | null;
}

/** Échéance d'une carte : posée, changée ou retirée sans toucher au reste du formulaire. */
export function DueDateField({ boardId, cardId, dueOn }: DueDateFieldProps) {
  const [value, setValue] = useState(dueOn ?? '');
  const setDueDate = useSetDueDate(boardId, cardId);
  const save = (nextValue: string | null) =>
    setDueDate.mutate({ dueOn: nextValue }, { onSuccess: () => setValue(nextValue ?? '') });
  return (
    <section aria-label="Échéance" className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold">Échéance</h3>
      <p className="text-muted">{dueOn ? `Le ${formatDueDate(dueOn)}` : 'Aucune échéance.'}</p>
      <TextField
        label="Date d'échéance"
        type="date"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        errors={setDueDate.error ? [getErrorMessage(setDueDate.error)] : undefined}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={setDueDate.isPending || value === '' || value === dueOn}
          onClick={() => save(value)}
        >
          Enregistrer l'échéance
        </Button>
        {dueOn && (
          <Button variant="secondary" disabled={setDueDate.isPending} onClick={() => save(null)}>
            Retirer l'échéance
          </Button>
        )}
      </div>
    </section>
  );
}
