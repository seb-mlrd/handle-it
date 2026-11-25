import type { z } from 'zod';
import { Button } from '../ui/button';
import { FormAlert } from '../ui/form-alert';
import { TextField } from '../ui/text-field';
import { useSchemaForm } from './use-schema-form';

interface SingleFieldFormProps<Input> {
  readonly schema: z.ZodType<Input>;
  readonly label: string;
  readonly fieldName: string;
  readonly submitLabel: string;
  readonly defaultValue?: string;
  /** Sert aux ajouts en série : le champ se vide et reste ouvert. */
  readonly resetOnSuccess?: boolean;
  readonly submit: (input: Input) => Promise<unknown>;
  readonly close: () => void;
}

/** Formulaire d'un seul champ ouvert à la demande : ajout rapide ou renommage. */
export function SingleFieldForm<Input>(props: SingleFieldFormProps<Input>) {
  const form = useSchemaForm({
    schema: props.schema,
    submit: props.submit,
    resetOnSuccess: props.resetOnSuccess ?? false,
  });
  return (
    <form
      ref={form.formReference}
      noValidate
      onSubmit={(event) => void form.handleSubmit(event)}
      onKeyDown={(event) => event.key === 'Escape' && props.close()}
      className="flex flex-col gap-3"
    >
      <FormAlert message={form.formError} />
      <TextField
        label={props.label}
        name={props.fieldName}
        autoComplete="off"
        autoFocus
        defaultValue={props.defaultValue}
        errors={form.fieldErrors[props.fieldName]}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={form.isPending}>
          {props.submitLabel}
        </Button>
        <Button variant="secondary" onClick={props.close}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
