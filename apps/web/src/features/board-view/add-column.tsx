import { columnRequestSchema } from '@handle-it/contracts';
import { useState } from 'react';
import { SingleFieldForm } from '../../shared/forms/single-field-form';
import { useReturnFocus } from '../../shared/focus/use-return-focus';
import { Button } from '../../shared/ui/button';
import { useCreateColumn } from './use-board-content';

interface AddColumnProps {
  readonly boardId: string;
  readonly isFirst: boolean;
}

export function AddColumn({ boardId, isFirst }: AddColumnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const createColumn = useCreateColumn(boardId);
  const openerReference = useReturnFocus<HTMLButtonElement>(isOpen);
  return (
    <li className="flex w-72 shrink-0 snap-start flex-col gap-3">
      {isFirst && (
        <p className="text-muted">Ce tableau est vide. Commence par ajouter une colonne.</p>
      )}
      {isOpen ? (
        <div className="rounded-card border border-line bg-surface p-3">
          <SingleFieldForm
            schema={columnRequestSchema}
            label="Nouvelle colonne"
            fieldName="name"
            submitLabel="Ajouter"
            isSerial
            submit={createColumn.mutateAsync}
            close={() => setIsOpen(false)}
          />
        </div>
      ) : (
        <Button ref={openerReference} variant="secondary" onClick={() => setIsOpen(true)}>
          Ajouter une colonne
        </Button>
      )}
    </li>
  );
}
