import { type CardResponse, updateCardRequestSchema } from '@handle-it/contracts';
import { useState } from 'react';
import { useSchemaForm } from '../../shared/forms/use-schema-form';
import { Button } from '../../shared/ui/button';
import { ConfirmDeleteDialog } from '../../shared/ui/confirm-delete-dialog';
import { FormAlert } from '../../shared/ui/form-alert';
import { TextArea } from '../../shared/ui/text-area';
import { TextField } from '../../shared/ui/text-field';
import { useDeleteCard, useUpdateCard } from './use-board-content';

const DESCRIPTION_ROWS = 10;

interface CardFormProps {
  readonly boardId: string;
  readonly card: CardResponse;
  readonly markAsDirty: () => void;
  readonly close: () => void;
}

export function CardForm({ boardId, card, markAsDirty, close }: CardFormProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const updateCard = useUpdateCard(boardId, card.id);
  const deleteCard = useDeleteCard(boardId, card.id);
  const form = useSchemaForm({
    schema: updateCardRequestSchema,
    submit: (request) => updateCard.mutateAsync(request).then(close),
  });
  return (
    <>
      <form
        ref={form.formReference}
        noValidate
        onChange={markAsDirty}
        onSubmit={(event) => void form.handleSubmit(event)}
        className="flex flex-col gap-5"
      >
        <FormAlert message={form.formError} />
        <TextField
          label="Titre"
          name="title"
          autoComplete="off"
          defaultValue={card.title}
          errors={form.fieldErrors['title']}
        />
        <TextArea
          label="Description"
          name="description"
          rows={DESCRIPTION_ROWS}
          defaultValue={card.description}
          errors={form.fieldErrors['description']}
        />
        <div className="flex flex-wrap justify-between gap-2">
          <Button type="submit" disabled={form.isPending}>
            {form.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Button variant="secondary" onClick={() => setIsConfirmingDelete(true)}>
            Supprimer la carte
          </Button>
        </div>
      </form>
      {isConfirmingDelete && (
        <ConfirmDeleteDialog
          title={`Supprimer « ${card.title} » ?`}
          consequence="Cette action est définitive."
          error={deleteCard.error}
          isPending={deleteCard.isPending}
          confirm={() => deleteCard.mutate(undefined, { onSuccess: close })}
          close={() => setIsConfirmingDelete(false)}
        />
      )}
    </>
  );
}
