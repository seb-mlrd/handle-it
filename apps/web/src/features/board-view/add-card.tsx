import { type ColumnViewResponse, createCardRequestSchema } from '@handle-it/contracts';
import { useState } from 'react';
import { SingleFieldForm } from '../../shared/forms/single-field-form';
import { Button } from '../../shared/ui/button';
import { useCreateCard } from './use-board-content';

interface AddCardProps {
  readonly boardId: string;
  readonly column: ColumnViewResponse;
}

export function AddCard({ boardId, column }: AddCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const createCard = useCreateCard(boardId, column.id);
  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        aria-label={`Ajouter une carte à ${column.name}`}
        onClick={() => setIsOpen(true)}
      >
        Ajouter une carte
      </Button>
    );
  }
  return (
    <SingleFieldForm
      schema={createCardRequestSchema}
      label="Nouvelle carte"
      fieldName="title"
      submitLabel="Ajouter"
      resetOnSuccess
      submit={createCard.mutateAsync}
      close={() => setIsOpen(false)}
    />
  );
}
