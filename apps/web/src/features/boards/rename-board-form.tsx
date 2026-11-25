import { type BoardResponse, boardRequestSchema } from '@handle-it/contracts';
import { useSchemaForm } from '../../shared/forms/use-schema-form';
import { Button } from '../../shared/ui/button';
import { FormAlert } from '../../shared/ui/form-alert';
import { TextField } from '../../shared/ui/text-field';
import { useRenameBoard } from './use-boards';

interface RenameBoardFormProps {
  readonly board: BoardResponse;
  readonly close: () => void;
}

export function RenameBoardForm({ board, close }: RenameBoardFormProps) {
  const renameBoard = useRenameBoard(board.id);
  const form = useSchemaForm({
    schema: boardRequestSchema,
    submit: async (request) => {
      await renameBoard.mutateAsync(request);
      close();
    },
  });
  return (
    <form
      ref={form.formReference}
      noValidate
      onSubmit={(event) => void form.handleSubmit(event)}
      onKeyDown={(event) => event.key === 'Escape' && close()}
      className="flex flex-col gap-3"
    >
      <FormAlert message={form.formError} />
      <TextField
        label="Nom du tableau"
        name="name"
        autoComplete="off"
        autoFocus
        defaultValue={board.name}
        errors={form.fieldErrors['name']}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={form.isPending}>
          Enregistrer
        </Button>
        <Button variant="secondary" onClick={close}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
