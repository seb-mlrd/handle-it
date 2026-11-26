import { boardRequestSchema } from '@handle-it/contracts';
import { useSchemaForm } from '../../shared/forms/use-schema-form';
import { Button } from '../../shared/ui/button';
import { FormAlert } from '../../shared/ui/form-alert';
import { TextField } from '../../shared/ui/text-field';
import { useCreateBoard } from './use-boards';

export function CreateBoardForm() {
  const createBoard = useCreateBoard();
  const form = useSchemaForm({
    schema: boardRequestSchema,
    submit: createBoard.mutateAsync,
    isSerial: true,
  });
  return (
    <form
      ref={form.formReference}
      noValidate
      onSubmit={(event) => void form.handleSubmit(event)}
      className="flex max-w-xl flex-col gap-3"
    >
      <FormAlert message={form.formError} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="grow">
          <TextField
            label="Nouveau tableau"
            name="name"
            autoComplete="off"
            errors={form.fieldErrors['name']}
          />
        </div>
        <div className="flex flex-col sm:mt-6.5">
          <Button type="submit">Créer le tableau</Button>
        </div>
      </div>
    </form>
  );
}
